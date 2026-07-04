import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID, randomBytes } from 'crypto';
import * as fs from 'fs/promises';
import * as bcrypt from 'bcryptjs';
import * as sharp from 'sharp';
import { Readable } from 'stream';
import { Role, Workspace } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AddCreatorDto } from './dto/add-creator.dto';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Duplicated from MediaService.resolveWorkspaceId rather than importing
   * MediaModule for one small helper unrelated to media — see that method's
   * own comment for why this resolves the user's first membership (the JWT
   * carries no workspaceId, and multi-workspace-per-user isn't exposed in
   * the UI yet).
   */
  async resolveWorkspaceId(userId: string): Promise<string> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: 'asc' },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of any workspace.');
    }
    return membership.workspaceId;
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

  async update(userId: string, role: Role, dto: UpdateWorkspaceDto): Promise<WorkspaceResponse> {
    this.assertCanManage(role);
    const workspaceId = await this.resolveWorkspaceId(userId);
    const workspace = await this.prisma.workspace.update({ where: { id: workspaceId }, data: dto });
    return this.toResponse(workspace);
  }

  async uploadLogo(userId: string, role: Role, file: Express.Multer.File): Promise<WorkspaceResponse> {
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

  async addMember(userId: string, role: Role, dto: AddMemberDto) {
    this.assertCanManage(role);
    const workspaceId = await this.resolveWorkspaceId(userId);

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

    return {
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
      // null when adding an existing account to the workspace — only a
      // freshly created login has a password to hand over.
      temporaryPassword,
    };
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

  async addCreator(userId: string, dto: AddCreatorDto) {
    const workspaceId = await this.resolveWorkspaceId(userId);
    return this.prisma.creator.create({
      data: { workspaceId, name: dto.name, email: dto.email },
    });
  }

  async listCreators(userId: string) {
    const workspaceId = await this.resolveWorkspaceId(userId);
    return this.prisma.creator.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
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
