import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID, randomBytes } from 'crypto';
import * as fs from 'fs/promises';
import * as bcrypt from 'bcryptjs';
import * as sharp from 'sharp';
import { Readable } from 'stream';
import { Role, Workspace } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import { inviteUserTemplate } from '../notification/templates/invite-user.template';
import { SystemEventsService } from '../events/system-events.service';
import { EVENT_TYPES } from '../events/event-types';
import { ServiceConfigService } from '../config/service-config.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { UpdateWorkspaceStatusDto } from './dto/update-workspace-status.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AddCreatorDto } from './dto/add-creator.dto';
import { UpdateCreatorDto } from './dto/update-creator.dto';
import { CreatorResponseDto, CreatorStatsDto, toCreatorResponse } from './dto/creator-response.dto';
import { validateLogoFile } from './validators/logo-validation';
import { uniqueWorkspaceSlug } from './workspace-slug.util';

const MANAGE_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN];
const LOGO_MAX_DIMENSION = 512;

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
  hasLogo: boolean;
  locale: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Platform-wide view for the SUPER_ADMIN workspace management page — never exposed to a plain member. */
export interface AdminWorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** One entry in the caller's own workspace list — see WorkspaceService.listMine. */
export interface WorkspaceMembershipSummary {
  id: string;
  name: string;
  slug: string;
  hasLogo: boolean;
  // WorkspaceMember.role — this caller's role WITHIN this workspace, never
  // to be confused with their global User.role (see resolveMembership's
  // comment below).
  role: Role;
  isActive: boolean;
}

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
    private readonly serviceConfig: ServiceConfigService,
    private readonly systemEvents: SystemEventsService,
  ) {}

  private async getActorDisplayName(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    return user?.name || user?.email || 'Someone';
  }

  /**
   * Duplicated from MediaService.resolveWorkspaceId rather than importing
   * MediaModule for one small helper unrelated to media — see that method's
   * own comment for the same duplication in PostsService/AuditService/
   * ActivityService. Every copy resolves the same way: the caller's active
   * workspace (see resolveMembership below), never a workspace ID taken
   * from the request.
   */
  async resolveWorkspaceId(userId: string): Promise<string> {
    return (await this.resolveMembership(userId)).workspaceId;
  }

  /**
   * The JWT's `role` claim is the user's GLOBAL account role (User.role,
   * defaults to USER for everyone except a seeded SUPER_ADMIN) — it is NOT
   * their role *within this workspace* (WorkspaceMember.role, which is what
   * OWNER/MANAGER actually means here). Every manage-permission check in
   * this service must resolve the real membership row and check that role,
   * not whatever role the controller happened to pass through from the JWT
   * — otherwise a workspace's own OWNER can never manage it (found and
   * fixed during the Beta stabilization sprint: registration now creates an
   * OWNER membership, but addMember/update/uploadLogo were still checking
   * the caller's global role, which is USER, and rejecting them).
   *
   * "Current workspace" resolution: prefer User.activeWorkspaceId (set at
   * registration, on workspace creation, and by switchActiveWorkspace —
   * never trusted from a request, only ever written here after checking a
   * real WorkspaceMember row exists). Falls back to the caller's oldest
   * membership when activeWorkspaceId is null (a pre-migration edge case
   * shouldn't exist after the backfill, but a defensive default costs
   * nothing) or when it points at a workspace the caller is no longer a
   * member of (e.g. they were removed) — never trust the stored id alone
   * without re-checking membership.
   */
  async resolveMembership(userId: string): Promise<{ workspaceId: string; role: Role }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { activeWorkspaceId: true } });
    if (user?.activeWorkspaceId) {
      const active = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: user.activeWorkspaceId, userId } },
      });
      if (active) return { workspaceId: active.workspaceId, role: active.role };
    }

    const fallback = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: 'asc' },
    });
    if (!fallback) {
      throw new ForbiddenException('You are not a member of any workspace.');
    }
    return { workspaceId: fallback.workspaceId, role: fallback.role };
  }

  /**
   * Every workspace the caller belongs to, with their per-workspace role and
   * which one is currently active — powers the frontend workspace switcher.
   * `isActive` is derived from the same resolution resolveMembership uses
   * (activeWorkspaceId, falling back to the oldest membership), so this list
   * and every other workspace-scoped endpoint always agree on "current".
   */
  async listMine(userId: string): Promise<WorkspaceMembershipSummary[]> {
    const [user, memberships] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { activeWorkspaceId: true } }),
      this.prisma.workspaceMember.findMany({
        where: { userId },
        orderBy: { joinedAt: 'asc' },
        include: { workspace: true },
      }),
    ]);

    const activeWorkspaceId = user?.activeWorkspaceId ?? memberships[0]?.workspaceId ?? null;

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      hasLogo: Boolean(m.workspace.logoUrl),
      role: m.role,
      isActive: m.workspace.id === activeWorkspaceId,
    }));
  }

  /**
   * Switches which workspace resolveMembership treats as "current" for this
   * user. The membership check below is the entire security boundary here:
   * a WorkspaceMember row for (workspaceId, userId) must exist, or this
   * throws ForbiddenException — a crafted/guessed workspace ID can never
   * become active without a real membership, regardless of what the client
   * sends. Never trust the frontend's own idea of which workspace is
   * active; this is the only place activeWorkspaceId is ever written.
   */
  async switchActiveWorkspace(userId: string, workspaceId: string): Promise<WorkspaceResponse> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of that workspace.');
    }

    const [, workspace] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { activeWorkspaceId: workspaceId } }),
      this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    ]);

    return this.toResponse(workspace);
  }

  private assertCanManage(role: Role): void {
    if (!MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException('You do not have permission to manage workspace settings.');
    }
  }

  async getWorkspace(userId: string): Promise<WorkspaceResponse> {
    const workspaceId = await this.resolveWorkspaceId(userId);
    const workspace = await this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    return this.toResponse(workspace);
  }

  /**
   * Creates an additional workspace with the caller as its OWNER. Available
   * to any authenticated user, not just SUPER_ADMIN — same self-service
   * capability registration already grants everyone once, just exposed as
   * its own action (see the codebase's own admin/workspaces placeholder
   * copy: "a user can be a member of multiple workspaces... nothing
   * assumes a single workspace exists").
   *
   * Workspace + OWNER membership + activating it are created in one
   * transaction for the same reason AuthService.register does it: a
   * failure partway through must never leave an ownerless workspace, a
   * membership pointing at a workspace that doesn't exist, or an
   * activeWorkspaceId pointing at a workspace whose creation rolled back.
   *
   * Switches the caller into the new workspace immediately (sets it as
   * their active workspace) — creating a workspace and then still looking
   * at your old one would be a confusing dead end now that switching is a
   * real, visible feature (see WorkspaceService.switchActiveWorkspace).
   */
  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceResponse> {
    const workspace = await this.prisma.$transaction(async (tx) => {
      const slug = await uniqueWorkspaceSlug(tx, dto.name);
      const txWorkspace = await tx.workspace.create({ data: { name: dto.name.trim(), slug } });
      await tx.workspaceMember.create({
        data: { workspaceId: txWorkspace.id, userId, role: Role.OWNER },
      });
      await tx.user.update({ where: { id: userId }, data: { activeWorkspaceId: txWorkspace.id } });
      return txWorkspace;
    });

    const actorName = await this.getActorDisplayName(userId);
    this.systemEvents.publish({
      type: EVENT_TYPES.WORKSPACE_CREATED,
      userId,
      workspaceId: workspace.id,
      actorName,
      targetType: 'Workspace',
      targetId: workspace.id,
      message: `${actorName} created workspace "${workspace.name}"`,
    });

    return this.toResponse(workspace);
  }

  async update(userId: string, dto: UpdateWorkspaceDto): Promise<WorkspaceResponse> {
    const { workspaceId, role } = await this.resolveMembership(userId);
    this.assertCanManage(role);
    const workspace = await this.prisma.workspace.update({ where: { id: workspaceId }, data: dto });

    const actorName = await this.getActorDisplayName(userId);
    this.systemEvents.publish({
      type: EVENT_TYPES.WORKSPACE_UPDATED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Workspace',
      targetId: workspaceId,
      message: `${actorName} updated workspace settings`,
      metadata: { fields: Object.keys(dto) },
    });

    return this.toResponse(workspace);
  }

  async uploadLogo(userId: string, file: Express.Multer.File): Promise<WorkspaceResponse> {
    const { role } = await this.resolveMembership(userId);
    this.assertCanManage(role);
    try {
      return await this.processLogoUpload(userId, file);
    } catch (err) {
      await fs.unlink(file.path).catch(() => undefined);
      throw err;
    }
  }

  private async processLogoUpload(userId: string, file: Express.Multer.File): Promise<WorkspaceResponse> {
    const workspaceId = await this.resolveWorkspaceId(userId);
    await validateLogoFile(file.originalname, file.path);

    // Normalize every upload to a single format/size — keeps the logo small
    // and consistent regardless of what was uploaded (premium feel, not just
    // "accept whatever").
    const resized = await sharp(file.path)
      .resize({ width: LOGO_MAX_DIMENSION, height: LOGO_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    await fs.unlink(file.path).catch(() => undefined);

    const workspace = await this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    const key = `${workspaceId}/branding/logo-${randomUUID()}.png`;
    await this.storageService.saveBuffer(key, resized);

    if (workspace.logoUrl) {
      await this.storageService.delete(workspace.logoUrl).catch(() => undefined);
    }

    const updated = await this.prisma.workspace.update({ where: { id: workspaceId }, data: { logoUrl: key } });

    const actorName = await this.getActorDisplayName(userId);
    this.systemEvents.publish({
      type: EVENT_TYPES.WORKSPACE_LOGO_CHANGED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Workspace',
      targetId: workspaceId,
      message: `${actorName} updated the workspace logo`,
    });

    return this.toResponse(updated);
  }

  async getLogoStream(userId: string): Promise<Readable> {
    const workspaceId = await this.resolveWorkspaceId(userId);
    const workspace = await this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    if (!workspace.logoUrl) throw new NotFoundException('No logo uploaded for this workspace.');
    return this.storageService.getReadStream(workspace.logoUrl);
  }

  /**
   * Every field here is a live count against real, already-existing data —
   * there is no separate "onboarding progress" table to drift out of sync.
   * AI connection is intentionally excluded from allRequiredDone: it's
   * marked optional in the checklist itself.
   */
  async getOnboardingStatus(userId: string) {
    const workspaceId = await this.resolveWorkspaceId(userId);
    const [workspace, memberCount, mediaCount, creatorCount, aiConnectionCount] = await Promise.all([
      this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { logoUrl: true } }),
      this.prisma.workspaceMember.count({ where: { workspaceId } }),
      this.prisma.media.count({ where: { workspaceId } }),
      this.prisma.creator.count({ where: { workspaceId } }),
      this.prisma.aIConnection.count({ where: { workspaceId, isActive: true } }),
    ]);

    const hasLogo = Boolean(workspace.logoUrl);
    const hasTeammate = memberCount > 1;
    const hasMedia = mediaCount > 0;
    const hasCreator = creatorCount > 0;
    const hasAiConnection = aiConnectionCount > 0;

    return {
      hasLogo,
      memberCount,
      hasTeammate,
      mediaCount,
      hasMedia,
      creatorCount,
      hasCreator,
      aiConnectionCount,
      hasAiConnection,
      allRequiredDone: hasLogo && hasTeammate && hasMedia && hasCreator,
    };
  }

  async addMember(userId: string, dto: AddMemberDto) {
    const { workspaceId, role } = await this.resolveMembership(userId);
    this.assertCanManage(role);

    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    let temporaryPassword: string | null = null;

    if (!user) {
      temporaryPassword = this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: this.generateUsername(dto.email),
          passwordHash,
          name: dto.name,
        },
      });
    } else {
      const existingMembership = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: user.id } },
      });
      if (existingMembership) {
        throw new BadRequestException('This person is already a member of the workspace.');
      }
    }

    const member = await this.prisma.workspaceMember.create({
      data: { workspaceId, userId: user.id, role: Role.USER },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const actorName = await this.getActorDisplayName(userId);
    const emailSent = await this.sendInviteEmail(workspaceId, actorName, member.user, temporaryPassword);

    this.systemEvents.publish({
      type: EVENT_TYPES.USER_INVITED,
      workspaceId,
      userId,
      actorName,
      targetType: 'User',
      targetId: member.user.id,
      message: `${actorName} invited ${member.user.name || member.user.email}`,
      metadata: { newAccount: Boolean(temporaryPassword), emailSent },
    });

    return {
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
      // null when adding an existing account to the workspace — only a
      // freshly created login has a password to hand over.
      temporaryPassword,
      // The member is added either way — a failed invite email is
      // best-effort and surfaced to the admin, not a reason to roll back.
      emailSent,
    };
  }

  private async sendInviteEmail(
    workspaceId: string,
    inviterName: string,
    recipient: { name: string | null; email: string },
    temporaryPassword: string | null,
  ): Promise<boolean> {
    try {
      const workspace = await this.prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { name: true } });
      await this.notificationService.sendTemplate(recipient.email, inviteUserTemplate, {
        recipientName: recipient.name || recipient.email,
        workspaceName: workspace.name,
        inviterName,
        loginUrl: `${this.serviceConfig.frontendUrl()}/login`,
        temporaryEmail: temporaryPassword ? recipient.email : undefined,
        temporaryPassword: temporaryPassword ?? undefined,
      });
      return true;
    } catch (err) {
      this.logger.warn(`Invite email failed for ${recipient.email}: ${err instanceof Error ? err.message : 'unknown error'}`);
      return false;
    }
  }

  async listMembers(userId: string) {
    const workspaceId = await this.resolveWorkspaceId(userId);
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((m) => ({ id: m.id, role: m.role, joinedAt: m.joinedAt, user: m.user }));
  }

  async addCreator(userId: string, dto: AddCreatorDto): Promise<CreatorResponseDto> {
    const { workspaceId, role } = await this.resolveMembership(userId);
    this.assertCanManage(role);
    const creator = await this.prisma.creator.create({
      data: { workspaceId, name: dto.name, email: dto.email, phone: dto.phone, bio: dto.bio, tags: dto.tags ?? [] },
    });

    const actorName = await this.getActorDisplayName(userId);
    this.systemEvents.publish({
      type: EVENT_TYPES.CREATOR_CREATED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Creator',
      targetId: creator.id,
      message: `${actorName} created creator "${creator.name}"`,
    });

    return toCreatorResponse(creator);
  }

  async listCreators(userId: string): Promise<CreatorResponseDto[]> {
    const workspaceId = await this.resolveWorkspaceId(userId);
    const creators = await this.prisma.creator.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
    return creators.map(toCreatorResponse);
  }

  async getCreator(userId: string, creatorId: string): Promise<CreatorResponseDto> {
    const { workspaceId } = await this.resolveMembership(userId);
    const creator = await this.getOwnedCreatorOrThrow(workspaceId, creatorId);
    return toCreatorResponse(creator);
  }

  async getCreatorStats(userId: string, creatorId: string): Promise<CreatorStatsDto> {
    const { workspaceId } = await this.resolveMembership(userId);
    await this.getOwnedCreatorOrThrow(workspaceId, creatorId);

    const [mediaCount, imageCount, videoCount, documentCount, sizeAgg] = await Promise.all([
      this.prisma.media.count({ where: { creatorId } }),
      this.prisma.media.count({ where: { creatorId, type: 'IMAGE' } }),
      this.prisma.media.count({ where: { creatorId, type: 'VIDEO' } }),
      this.prisma.media.count({ where: { creatorId, type: 'DOCUMENT' } }),
      this.prisma.media.aggregate({ where: { creatorId }, _sum: { sizeBytes: true } }),
    ]);

    return {
      mediaCount,
      imageCount,
      videoCount,
      documentCount,
      storageBytes: Number(sizeAgg._sum.sizeBytes ?? 0n),
    };
  }

  async updateCreator(userId: string, creatorId: string, dto: UpdateCreatorDto): Promise<CreatorResponseDto> {
    const { workspaceId, role } = await this.resolveMembership(userId);
    this.assertCanManage(role);
    const existing = await this.getOwnedCreatorOrThrow(workspaceId, creatorId);

    if (dto.avatarUrl) {
      const media = await this.prisma.media.findFirst({ where: { id: dto.avatarUrl, workspaceId, creatorId } });
      if (!media) throw new NotFoundException("Media not found in this creator's library");
    }

    const updated = await this.prisma.creator.update({ where: { id: creatorId }, data: dto });

    const actorName = await this.getActorDisplayName(userId);
    const statusChanged = dto.status !== undefined && dto.status !== existing.status;
    this.systemEvents.publish({
      type: EVENT_TYPES.CREATOR_UPDATED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Creator',
      targetId: creatorId,
      message: statusChanged
        ? `${actorName} set "${updated.name}" to ${dto.status}`
        : `${actorName} updated creator "${updated.name}"`,
      metadata: { fields: Object.keys(dto) },
    });

    return toCreatorResponse(updated);
  }

  async removeCreator(userId: string, creatorId: string): Promise<void> {
    const { workspaceId, role } = await this.resolveMembership(userId);
    this.assertCanManage(role);
    const existing = await this.getOwnedCreatorOrThrow(workspaceId, creatorId);

    await this.prisma.creator.delete({ where: { id: creatorId } });

    const actorName = await this.getActorDisplayName(userId);
    this.systemEvents.publish({
      type: EVENT_TYPES.CREATOR_DELETED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Creator',
      targetId: creatorId,
      message: `${actorName} deleted creator "${existing.name}"`,
    });
  }

  /** Workspace-scoped lookup — 404s (not 403) if the creator belongs to a different workspace, so its existence is never leaked cross-tenant. */
  private async getOwnedCreatorOrThrow(workspaceId: string, creatorId: string) {
    const creator = await this.prisma.creator.findFirst({ where: { id: creatorId, workspaceId } });
    if (!creator) throw new NotFoundException('Creator not found');
    return creator;
  }

  /**
   * Platform-wide — callers reach this only via a SUPER_ADMIN-gated route
   * (see WorkspaceController), so it deliberately does not go through
   * resolveMembership/resolveWorkspaceId at all: a platform admin manages
   * workspaces directly by ID, not through "their" workspace.
   */
  async listAllForAdmin(): Promise<AdminWorkspaceListItem[]> {
    const workspaces = await this.prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });
    return workspaces.map((w) => this.toAdminListItem(w));
  }

  /**
   * Activate/deactivate a workspace platform-wide. `isActive` already
   * existed on the schema with no write path anywhere — this is the first
   * one. Not wired into any request-blocking check yet (no endpoint reads
   * it to reject a deactivated workspace's members) — that enforcement is
   * a separate follow-up, this is the admin control surface for it.
   */
  async setActiveStatus(callerId: string, workspaceId: string, dto: UpdateWorkspaceStatusDto): Promise<AdminWorkspaceListItem> {
    const existing = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!existing) throw new NotFoundException('Workspace not found');

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { isActive: dto.isActive },
      include: { _count: { select: { members: true } } },
    });

    const actorName = await this.getActorDisplayName(callerId);
    this.systemEvents.publish({
      type: EVENT_TYPES.WORKSPACE_UPDATED,
      userId: callerId,
      workspaceId,
      actorName,
      targetType: 'Workspace',
      targetId: workspaceId,
      message: `${actorName} ${dto.isActive ? 'activated' : 'deactivated'} workspace "${updated.name}"`,
      metadata: { fields: ['isActive'] },
    });

    return this.toAdminListItem(updated);
  }

  private toAdminListItem(workspace: Workspace & { _count: { members: number } }): AdminWorkspaceListItem {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      isActive: workspace.isActive,
      memberCount: workspace._count.members,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  private generateUsername(email: string): string {
    const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    const suffix = randomBytes(3).toString('hex');
    return `${base}${suffix}`;
  }

  private generateTemporaryPassword(): string {
    return randomBytes(9).toString('base64url');
  }

  private toResponse(workspace: Workspace): WorkspaceResponse {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      hasLogo: Boolean(workspace.logoUrl),
      locale: workspace.locale,
      timezone: workspace.timezone,
      dateFormat: workspace.dateFormat,
      numberFormat: workspace.numberFormat,
      currency: workspace.currency,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
