import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

const MANAGE_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN];
const OWNER_SELECT = { id: true, name: true, email: true } satisfies Prisma.UserSelect;

type MediaWithOwner = Media & { owner: { id: string; name: string | null; email: string } };

export interface MediaResponse {
  id: string;
  workspaceId: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string;
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
  ) {}

  /**
   * The JWT carries no workspaceId (auth predates multi-workspace UI) and the
   * schema's own comment notes workspace enforcement is intentionally open —
   * so we resolve a user's first membership. Revisit once workspace
   * switching exists in the UI.
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

  async upload(file: Express.Multer.File, userId: string): Promise<MediaResponse> {
    try {
      return await this.processUpload(file, userId);
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

  private async processUpload(file: Express.Multer.File, userId: string): Promise<MediaResponse> {
    const workspaceId = await this.resolveWorkspaceId(userId);
    const validated = await validateUploadedFile(file.originalname, file.path);

    const safeFilename = `${randomUUID()}.${validated.extension}`;
    const key = this.buildKey(workspaceId, safeFilename);
    await this.storageService.save(key, file.path);

    const created = await this.prisma.media.create({
      data: {
        workspaceId,
        ownerId: userId,
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

    return this.toResponse(updated);
  }

  async list(userId: string, query: ListMediaQueryDto) {
    const workspaceId = await this.resolveWorkspaceId(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 60;

    const where: Prisma.MediaWhereInput = {
      workspaceId,
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

  async rename(userId: string, role: Role, id: string, dto: RenameMediaDto): Promise<MediaResponse> {
    const media = await this.getOwnedOrThrow(userId, id);
    this.assertCanManage(userId, role, media);
    const updated = await this.prisma.media.update({
      where: { id },
      data: { originalFilename: dto.originalFilename },
      include: { owner: { select: OWNER_SELECT } },
    });
    return this.toResponse(updated);
  }

  async remove(userId: string, role: Role, id: string): Promise<void> {
    const media = await this.getOwnedOrThrow(userId, id);
    this.assertCanManage(userId, role, media);

    await this.storageService.delete(media.storagePath).catch(() => undefined);
    if (media.thumbnailPath) {
      await this.storageService.delete(`${media.thumbnailPath}_sm.jpg`).catch(() => undefined);
      await this.storageService.delete(`${media.thumbnailPath}_md.jpg`).catch(() => undefined);
    }
    await this.prisma.media.delete({ where: { id } });
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
