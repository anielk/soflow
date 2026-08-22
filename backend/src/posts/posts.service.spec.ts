import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostStatus, PostType, Role } from '@prisma/client';
import { PostsService } from './posts.service';

function buildService(prisma: any) {
  const systemEvents = { publish: jest.fn() };
  const service = new PostsService(prisma, systemEvents as any);
  return { service, systemEvents };
}

const AUTHOR = { id: 'user-1', name: 'Ada', email: 'ada@example.com' };

describe('PostsService.create', () => {
  it('saves as DRAFT when no scheduledAt is given', async () => {
    const findFirst = jest.fn().mockResolvedValue({ workspaceId: 'ws1', role: Role.OWNER });
    const create = jest.fn().mockResolvedValue({
      id: 'post-1',
      workspaceId: 'ws1',
      authorId: 'user-1',
      caption: 'Hello',
      type: PostType.FREE,
      price: null,
      status: PostStatus.DRAFT,
      scheduledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: AUTHOR,
      media: [],
    });
    const prisma = { workspaceMember: { findFirst }, post: { create }, media: { count: jest.fn() } };
    const { service, systemEvents } = buildService(prisma);

    const result = await service.create('user-1', { caption: 'Hello' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: PostStatus.DRAFT, scheduledAt: undefined }) }),
    );
    expect(result.status).toBe(PostStatus.DRAFT);
    expect(systemEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'post.created', workspaceId: 'ws1', userId: 'user-1' }),
    );
  });

  it('saves as SCHEDULED when scheduledAt is given', async () => {
    const findFirst = jest.fn().mockResolvedValue({ workspaceId: 'ws1', role: Role.OWNER });
    const create = jest.fn().mockResolvedValue({
      id: 'post-2',
      workspaceId: 'ws1',
      authorId: 'user-1',
      caption: null,
      type: PostType.FREE,
      price: null,
      status: PostStatus.SCHEDULED,
      scheduledAt: new Date('2026-09-01T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      author: AUTHOR,
      media: [],
    });
    const prisma = { workspaceMember: { findFirst }, post: { create }, media: { count: jest.fn() } };
    const { service } = buildService(prisma);

    const result = await service.create('user-1', { scheduledAt: '2026-09-01T10:00:00Z' });

    expect(result.status).toBe(PostStatus.SCHEDULED);
  });

  it('rejects a mediaId that does not belong to the caller workspace', async () => {
    const findFirst = jest.fn().mockResolvedValue({ workspaceId: 'ws1', role: Role.OWNER });
    const count = jest.fn().mockResolvedValue(0); // none of the requested media IDs matched
    const prisma = { workspaceMember: { findFirst }, media: { count }, post: { create: jest.fn() } };
    const { service } = buildService(prisma);

    await expect(service.create('user-1', { mediaIds: ['other-workspace-media'] })).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException for a caller with no workspace membership', async () => {
    const prisma = { workspaceMember: { findFirst: jest.fn().mockResolvedValue(null) } };
    const { service } = buildService(prisma);

    await expect(service.create('user-1', {})).rejects.toThrow(ForbiddenException);
  });
});

describe('PostsService.update', () => {
  it('moving scheduledAt to null returns the post to DRAFT', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce({ workspaceId: 'ws1', role: Role.OWNER }) // resolveMembership
      .mockResolvedValueOnce({
        // getOwnedOrThrow's post lookup
        id: 'post-1',
        workspaceId: 'ws1',
        authorId: 'user-1',
        status: PostStatus.SCHEDULED,
        type: PostType.FREE,
        author: AUTHOR,
        media: [],
      });
    const update = jest.fn().mockResolvedValue({
      id: 'post-1',
      workspaceId: 'ws1',
      authorId: 'user-1',
      caption: null,
      type: PostType.FREE,
      price: null,
      status: PostStatus.DRAFT,
      scheduledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: AUTHOR,
      media: [],
    });
    const prisma = { workspaceMember: { findFirst }, post: { findFirst, update } };
    const { service } = buildService(prisma);

    const result = await service.update('user-1', 'post-1', { scheduledAt: null });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ scheduledAt: null, status: PostStatus.DRAFT }) }),
    );
    expect(result.status).toBe(PostStatus.DRAFT);
  });

  it('a non-author, non-manager workspace member cannot edit someone else\'s post', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce({ workspaceId: 'ws1', role: Role.USER })
      .mockResolvedValueOnce({
        id: 'post-1',
        workspaceId: 'ws1',
        authorId: 'someone-else',
        status: PostStatus.DRAFT,
        type: PostType.FREE,
        author: AUTHOR,
        media: [],
      });
    const prisma = { workspaceMember: { findFirst }, post: { findFirst, update: jest.fn() } };
    const { service } = buildService(prisma);

    await expect(service.update('user-1', 'post-1', { caption: 'edit' })).rejects.toThrow(ForbiddenException);
  });
});

describe('PostsService.remove', () => {
  it('throws NotFoundException for a post in a different workspace', async () => {
    const findFirst = jest.fn().mockResolvedValueOnce({ workspaceId: 'ws1', role: Role.OWNER }).mockResolvedValueOnce(null);
    const prisma = { workspaceMember: { findFirst }, post: { findFirst, delete: jest.fn() } };
    const { service } = buildService(prisma);

    await expect(service.remove('user-1', 'post-in-other-workspace')).rejects.toThrow(NotFoundException);
  });
});
