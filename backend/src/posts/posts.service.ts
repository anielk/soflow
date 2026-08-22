import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Post, PostStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SystemEventsService } from '../events/system-events.service';
import { EVENT_TYPES } from '../events/event-types';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';

const MANAGE_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN];
const AUTHOR_SELECT = { id: true, name: true, email: true } satisfies Prisma.UserSelect;

type PostWithAuthorAndMedia = Post & {
  author: { id: string; name: string | null; email: string };
  media: { id: string }[];
};

export interface PostResponse {
  id: string;
  workspaceId: string;
  authorId: string;
  authorName: string;
  caption: string | null;
  type: Post['type'];
  price: number | null;
  status: PostStatus;
  scheduledAt: Date | null;
  mediaIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemEvents: SystemEventsService,
  ) {}

  /**
   * Same resolution as MediaService/WorkspaceService: the JWT carries no
   * workspaceId, so a caller's first membership stands in for "their
   * workspace" until workspace switching exists in the UI.
   */
  private async resolveMembership(userId: string): Promise<{ workspaceId: string; role: Role }> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: 'asc' },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of any workspace.');
    }
    return { workspaceId: membership.workspaceId, role: membership.role };
  }

  /** Throws NotFoundException rather than leaking whether a media ID exists in a different workspace. */
  private async assertMediaInWorkspace(workspaceId: string, mediaIds: string[]): Promise<void> {
    if (mediaIds.length === 0) return;
    const count = await this.prisma.media.count({ where: { id: { in: mediaIds }, workspaceId } });
    if (count !== mediaIds.length) {
      throw new NotFoundException('One or more media files were not found in this workspace.');
    }
  }

  async create(userId: string, dto: CreatePostDto): Promise<PostResponse> {
    const { workspaceId } = await this.resolveMembership(userId);
    const mediaIds = dto.mediaIds ?? [];
    await this.assertMediaInWorkspace(workspaceId, mediaIds);

    const created = await this.prisma.post.create({
      data: {
        workspaceId,
        authorId: userId,
        caption: dto.caption,
        type: dto.type,
        price: dto.type === 'PPV' ? dto.price : undefined,
        status: dto.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        media: mediaIds.length ? { connect: mediaIds.map((id) => ({ id })) } : undefined,
      },
      include: { author: { select: AUTHOR_SELECT }, media: { select: { id: true } } },
    });

    const actorName = created.author.name || created.author.email;
    this.systemEvents.publish({
      type: EVENT_TYPES.POST_CREATED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Post',
      targetId: created.id,
      message: `${actorName} ${created.status === PostStatus.SCHEDULED ? 'scheduled' : 'drafted'} a post`,
      metadata: { status: created.status, type: created.type },
    });

    return this.toResponse(created);
  }

  async list(userId: string, query: ListPostsQueryDto): Promise<PostResponse[]> {
    const { workspaceId } = await this.resolveMembership(userId);
    const where: Prisma.PostWhereInput = {
      workspaceId,
      ...(query.status ? { status: query.status } : {}),
    };

    const posts = await this.prisma.post.findMany({
      where,
      include: { author: { select: AUTHOR_SELECT }, media: { select: { id: true } } },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });

    return posts.map((post) => this.toResponse(post));
  }

  private async getOwnedOrThrow(userId: string, id: string): Promise<{ post: PostWithAuthorAndMedia; workspaceId: string; role: Role }> {
    const { workspaceId, role } = await this.resolveMembership(userId);
    const post = await this.prisma.post.findFirst({
      where: { id, workspaceId },
      include: { author: { select: AUTHOR_SELECT }, media: { select: { id: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');
    return { post, workspaceId, role };
  }

  async getById(userId: string, id: string): Promise<PostResponse> {
    const { post } = await this.getOwnedOrThrow(userId, id);
    return this.toResponse(post);
  }

  private assertCanManage(userId: string, role: Role, post: Post): void {
    if (post.authorId !== userId && !MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException('You do not have permission to modify this post.');
    }
  }

  async update(userId: string, id: string, dto: UpdatePostDto): Promise<PostResponse> {
    const { post, workspaceId, role } = await this.getOwnedOrThrow(userId, id);
    this.assertCanManage(userId, role, post);

    if (dto.mediaIds) await this.assertMediaInWorkspace(workspaceId, dto.mediaIds);
    const nextType = dto.type ?? post.type;
    const scheduledAtProvided = Object.prototype.hasOwnProperty.call(dto, 'scheduledAt');
    const nextScheduledAt = scheduledAtProvided && dto.scheduledAt ? new Date(dto.scheduledAt) : null;

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.price !== undefined ? { price: nextType === 'PPV' ? dto.price : null } : {}),
        ...(scheduledAtProvided ? { scheduledAt: nextScheduledAt, status: nextScheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT } : {}),
        ...(dto.mediaIds ? { media: { set: dto.mediaIds.map((mid) => ({ id: mid })) } } : {}),
      },
      include: { author: { select: AUTHOR_SELECT }, media: { select: { id: true } } },
    });

    const actorName = updated.author.name || updated.author.email;
    this.systemEvents.publish({
      type: EVENT_TYPES.POST_UPDATED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Post',
      targetId: updated.id,
      message: `${actorName} updated a post`,
      metadata: { status: updated.status, type: updated.type },
    });

    return this.toResponse(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { post, workspaceId, role } = await this.getOwnedOrThrow(userId, id);
    this.assertCanManage(userId, role, post);

    await this.prisma.post.delete({ where: { id } });

    const actorName = post.author.name || post.author.email;
    this.systemEvents.publish({
      type: EVENT_TYPES.POST_DELETED,
      workspaceId,
      userId,
      actorName,
      targetType: 'Post',
      targetId: post.id,
      message: `${actorName} deleted a post`,
    });
  }

  private toResponse(post: PostWithAuthorAndMedia): PostResponse {
    return {
      id: post.id,
      workspaceId: post.workspaceId,
      authorId: post.authorId,
      authorName: post.author.name || post.author.email,
      caption: post.caption,
      type: post.type,
      price: post.price,
      status: post.status,
      scheduledAt: post.scheduledAt,
      mediaIds: post.media.map((m) => m.id),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
