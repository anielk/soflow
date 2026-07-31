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
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AddCreatorDto } from './dto/add-creator.dto';
import { UpdateCreatorDto } from './dto/update-creator.dto';
import { CreatorResponseDto, CreatorStatsDto, toCreatorResponse } from './dto/creator-response.dto';
import { validateLogoFile } from './validators/logo-validation';

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
   * own comment for why this resolves the user's first membership (the JWT
   * carries no workspaceId, and multi-workspace-per-user isn't exposed in
   * the UI yet).
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
   */
  async resolveMembership(userId: string): Promise<{ workspaceId: string; role: Role }> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: 'asc' },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of any workspace.');
    }
    return { workspaceId: membership.workspaceId, role: membership.role };
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
