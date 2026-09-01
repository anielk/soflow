import { ForbiddenException, Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import { Readable } from 'stream';
import { Media, MediaStatus, MediaType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ThumbnailService } from './thumbnail.service';
import { validateUploadedFile } from './validators/file-validation';
import { ListMediaQueryDto } from './dto/list-media-query.dto';
import { RenameMediaDto } from './dto/rename-media.dto';
import { SystemEventsService } from '../events/system-events.service';
import { EVENT_TYPES } from '../events/event-types';
import { resolveUploadLimitMb } from './upload-limits';

const MANAGE_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN];
const OWNER_SELECT = { id: true, name: true, email: true } satisfies Prisma.UserSelect;

type MediaWithOwner = Media & { owner: { id: string; name: string | null; email: string } };

export interface MediaResponse {
  id: string;
  workspaceId: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string;
  creatorId: string | null;
  filename: string;
  originalFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  type: MediaType;
  status: MediaStatus;
  hasThumbnail: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly thumbnailService: ThumbnailService,
    private readonly systemEvents: SystemEventsService,
  ) {}

  /**
   * The JWT carries no workspaceId (identity only) — so "which workspace"
   * comes from the caller's active-workspace preference instead. See
   * resolveMembership below for the actual resolution/fallback; duplicated
   * across MediaService/PostsService/WorkspaceService/AuditService/
   * ActivityService rather than sharing one module for a two-query helper.
   */
  async resolveWorkspaceId(userId: string): Promise<string> {
    return (await this.resolveMembership(userId)).workspaceId;
  }

  /**
   * The JWT's `role` claim is the caller's GLOBAL account role (User.role,
   * USER for everyone except a seeded SUPER_ADMIN) — NOT their role within
   * this workspace (WorkspaceMember.role). assertCanManage must check the
   * real membership role, not whatever the controller passed through from
   * the JWT, or a workspace's own OWNER can never manage anyone else's
   * files (same class of bug fixed in WorkspaceService during the Beta
   * stabilization sprint).
   *
   * "Current workspace": User.activeWorkspaceId (see
   * WorkspaceService.switchActiveWorkspace — the only place that's ever
   * written, always after checking a real membership exists), falling back
   * to the caller's oldest membership if it's null or stale (they were
   * removed from that workspace since).
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

  async upload(file: Express.Multer.File, userId: string, creatorId?: string, callerRole?: Role): Promise<MediaResponse> {
    try {
      return await this.processUpload(file, userId, creatorId, callerRole);
    } catch (err) {
      // Multer has already staged the file in .tmp by the time this method
      // runs, regardless of where processing fails (workspace resolution,
      // validation, or the storage write itself) — clean it up on any
      // failure. A no-op (ignored ENOENT) once storageService.save() has
      // already moved it into permanent storage.
      await fs.unlink(file.path).catch(() => undefined);
      throw err;
    }
  }

  private async processUpload(file: Express.Multer.File, userId: string, creatorId?: string, callerRole?: Role): Promise<MediaResponse> {
    const workspaceId = await this.resolveWorkspaceId(userId);
    await this.assertWithinUploadLimit(workspaceId, file.size, callerRole);
    if (creatorId) await this.assertCreatorInWorkspace(workspaceId, creatorId);
    const validated = await validateUploadedFile(file.originalname, file.path);

    const safeFilename = `${randomUUID()}.${validated.extension}`;
    const key = this.buildKey(workspaceId, safeFilename);
    await this.storageService.save(key, file.path);

    const created = await this.prisma.media.create({
      data: {
        workspaceId,
        ownerId: userId,
        creatorId: creatorId ?? null,
        filename: safeFilename,
        originalFilename: file.originalname,
        mimeType: validated.mimeType,
        extension: validated.extension,
        sizeBytes: BigInt(file.size),
        type: validated.type,
        status: MediaStatus.PROCESSING,
        storageProvider: 'local',
        storagePath: key,
      },
      include: { owner: { select: OWNER_SELECT } },
    });

    // Thumbnailing runs synchronously (no job queue exists yet) and is
    // best-effort: a failure here still leaves the upload itself READY.
    const absolutePath = this.storageService.resolveAbsolutePath(key);
    const thumbnail = await this.thumbnailService.generate(validated.type, absolutePath);

    let thumbnailKey: string | null = null;
    if (thumbnail) {
      thumbnailKey = this.buildKey(workspaceId, randomUUID());
      await Promise.all([
        this.storageService.saveBuffer(`${thumbnailKey}_sm.jpg`, thumbnail.small),
        this.storageService.saveBuffer(`${thumbnailKey}_md.jpg`, thumbnail.medium),
      ]);
    }

    const updated = await this.prisma.media.update({
      where: { id: created.id },
      data: {
        status: MediaStatus.READY,
        width: thumbnail?.width ?? null,
        height: thumbnail?.height ?? null,
        duration: thumbnail?.duration ?? null,
        thumbnailPath: thumbnailKey,
      },
      include: { owner: { select: OWNER_SELECT } },
    });

    const actorName = updated.owner.name || updated.owner.email;
    this.systemEvents.publish({
      type: EVENT_TYPES.MEDIA_UPLOADED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Media',
      targetId: updated.id,
      message: `${actorName} uploaded ${updated.originalFilename}`,
      metadata: { type: updated.type, sizeBytes: updated.sizeBytes.toString() },
    });

    return this.toResponse(updated);
  }

  /**
   * The real, business-facing upload cap — plan-based (see upload-limits.ts),
   * not the flat MEDIA_MAX_FILE_SIZE_MB Multer ceiling in media.module.ts,
   * which only exists as a technical backstop above the largest plan limit.
   */
  private async assertWithinUploadLimit(workspaceId: string, fileSizeBytes: number, callerRole?: Role): Promise<void> {
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { plan: true, maxUploadSizeMb: true },
    });
    const limitMb = resolveUploadLimitMb(workspace.plan, workspace.maxUploadSizeMb, callerRole);
    if (fileSizeBytes > limitMb * 1024 * 1024) {
      throw new PayloadTooLargeException(`File exceeds this workspace's ${limitMb}MB upload limit.`);
    }
  }

  /** Throws NotFoundException rather than leaking whether a creator ID exists in a different workspace. */
  private async assertCreatorInWorkspace(workspaceId: string, creatorId: string): Promise<void> {
    const creator = await this.prisma.creator.findFirst({ where: { id: creatorId, workspaceId }, select: { id: true } });
    if (!creator) throw new NotFoundException('Creator not found');
  }

  async list(userId: string, query: ListMediaQueryDto) {
    const workspaceId = await this.resolveWorkspaceId(userId);
    if (query.creatorId) await this.assertCreatorInWorkspace(workspaceId, query.creatorId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 60;

    const where: Prisma.MediaWhereInput = {
      workspaceId,
      ...(query.creatorId ? { creatorId: query.creatorId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { filename: { contains: query.search, mode: 'insensitive' } },
              { originalFilename: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy = {
      [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc',
    } as Prisma.MediaOrderByWithRelationInput;

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        include: { owner: { select: OWNER_SELECT } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async getOwnedOrThrow(userId: string, id: string): Promise<MediaWithOwner> {
    const workspaceId = await this.resolveWorkspaceId(userId);
    const media = await this.prisma.media.findFirst({
      where: { id, workspaceId },
      include: { owner: { select: OWNER_SELECT } },
    });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async getById(userId: string, id: string): Promise<MediaResponse> {
    return this.toResponse(await this.getOwnedOrThrow(userId, id));
  }

  async getFileStream(userId: string, id: string): Promise<{ stream: Readable; media: MediaWithOwner }> {
    const media = await this.getOwnedOrThrow(userId, id);
    const stream = await this.storageService.getReadStream(media.storagePath);
    return { stream, media };
  }

  async getThumbnailStream(
    userId: string,
    id: string,
    size: 'small' | 'medium',
  ): Promise<{ stream: Readable; media: MediaWithOwner }> {
    const media = await this.getOwnedOrThrow(userId, id);
    if (!media.thumbnailPath) throw new NotFoundException('No thumbnail available for this file');
    const suffix = size === 'small' ? '_sm.jpg' : '_md.jpg';
    const stream = await this.storageService.getReadStream(`${media.thumbnailPath}${suffix}`);
    return { stream, media };
  }

  async rename(userId: string, id: string, dto: RenameMediaDto): Promise<MediaResponse> {
    const media = await this.getOwnedOrThrow(userId, id);
    const { role } = await this.resolveMembership(userId);
    this.assertCanManage(userId, role, media);
    const updated = await this.prisma.media.update({
      where: { id },
      data: { originalFilename: dto.originalFilename },
      include: { owner: { select: OWNER_SELECT } },
    });
    return this.toResponse(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const media = await this.getOwnedOrThrow(userId, id);
    const { role } = await this.resolveMembership(userId);
    this.assertCanManage(userId, role, media);

    await this.storageService.delete(media.storagePath).catch(() => undefined);
    if (media.thumbnailPath) {
      await this.storageService.delete(`${media.thumbnailPath}_sm.jpg`).catch(() => undefined);
      await this.storageService.delete(`${media.thumbnailPath}_md.jpg`).catch(() => undefined);
    }
    await this.prisma.media.delete({ where: { id } });

    const actorName = media.owner.name || media.owner.email;
    this.systemEvents.publish({
      type: EVENT_TYPES.MEDIA_DELETED,
      workspaceId: media.workspaceId,
      userId,
      actorName,
      targetType: 'Media',
      targetId: media.id,
      message: `${actorName} deleted ${media.originalFilename}`,
    });
  }

  private buildKey(workspaceId: string, filename: string): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${workspaceId}/${year}/${month}/${filename}`;
  }

  private assertCanManage(userId: string, role: Role, media: Media): void {
    if (media.ownerId !== userId && !MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException('You do not have permission to modify this file.');
    }
  }

  private toResponse(media: MediaWithOwner): MediaResponse {
    return {
      id: media.id,
      workspaceId: media.workspaceId,
      ownerId: media.ownerId,
      ownerName: media.owner.name,
      ownerEmail: media.owner.email,
      creatorId: media.creatorId,
      filename: media.filename,
      originalFilename: media.originalFilename,
      mimeType: media.mimeType,
      extension: media.extension,
      sizeBytes: media.sizeBytes.toString(),
      width: media.width,
      height: media.height,
      duration: media.duration,
      type: media.type,
      status: media.status,
      hasThumbnail: Boolean(media.thumbnailPath),
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
