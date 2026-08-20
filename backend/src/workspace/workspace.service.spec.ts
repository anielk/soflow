import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { WorkspaceService } from './workspace.service';

function buildService(prisma: any) {
  const systemEvents = { publish: jest.fn() };
  const storageService = {} as any;
  const notificationService = {} as any;
  const serviceConfig = { frontendUrl: () => 'http://localhost:3000' } as any;
  const service = new WorkspaceService(prisma, storageService, notificationService, serviceConfig, systemEvents as any);
  return { service, systemEvents };
}

describe('WorkspaceService.create', () => {
  it('creates a workspace and makes the caller OWNER inside one transaction', async () => {
    const createdWorkspace = {
      id: 'ws1',
      name: 'Acme',
      slug: 'acme',
      plan: 'free',
      logoUrl: null,
      locale: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US',
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const workspaceCreate = jest.fn().mockResolvedValue(createdWorkspace);
    const workspaceFindUnique = jest.fn().mockResolvedValue(null); // slug free on first try
    const memberCreate = jest.fn().mockResolvedValue({});
    const tx = {
      workspace: { create: workspaceCreate, findUnique: workspaceFindUnique },
      workspaceMember: { create: memberCreate },
    };
    const prisma = {
      $transaction: jest.fn((cb: any) => cb(tx)),
      user: { findUnique: jest.fn().mockResolvedValue({ name: 'Ada', email: 'ada@example.com' }) },
    };

    const { service, systemEvents } = buildService(prisma);
    const result = await service.create('user-1', { name: 'Acme' });

    expect(workspaceCreate).toHaveBeenCalledWith({ data: { name: 'Acme', slug: 'acme' } });
    expect(memberCreate).toHaveBeenCalledWith({ data: { workspaceId: 'ws1', userId: 'user-1', role: Role.OWNER } });
    expect(result.id).toBe('ws1');
    expect(systemEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'workspace.created', workspaceId: 'ws1', userId: 'user-1' }),
    );
  });

  it('retries the slug on collision, then throws ConflictException once every attempt collides (duplicate name)', async () => {
    const workspaceFindUnique = jest.fn().mockResolvedValue({ id: 'existing' }); // always collides
    const tx = {
      workspace: { create: jest.fn(), findUnique: workspaceFindUnique },
      workspaceMember: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((cb: any) => cb(tx)) };
    const { service } = buildService(prisma);

    await expect(service.create('user-1', { name: 'Acme' })).rejects.toThrow(ConflictException);
    expect(workspaceFindUnique).toHaveBeenCalledTimes(5);
  });
});

describe('WorkspaceService.listAllForAdmin', () => {
  it('maps workspaces with their member counts, platform-wide, without resolving any single membership', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'ws1',
        name: 'A',
        slug: 'a',
        plan: 'free',
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        _count: { members: 3 },
      },
    ]);
    const prisma = { workspace: { findMany } };
    const { service } = buildService(prisma);

    const result = await service.listAllForAdmin();
    expect(findMany).toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: 'ws1',
        name: 'A',
        slug: 'a',
        plan: 'free',
        isActive: true,
        memberCount: 3,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    ]);
  });
});

describe('WorkspaceService.setActiveStatus', () => {
  it('throws NotFoundException for a workspace that does not exist (invalid case)', async () => {
    const prisma = { workspace: { findUnique: jest.fn().mockResolvedValue(null) } };
    const { service } = buildService(prisma);

    await expect(service.setActiveStatus('admin-1', 'missing-id', { isActive: false })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deactivates an existing workspace and publishes a WORKSPACE_UPDATED event', async () => {
    const workspaceFindUnique = jest.fn().mockResolvedValue({ id: 'ws1' });
    const workspaceUpdate = jest.fn().mockResolvedValue({
      id: 'ws1',
      name: 'Acme',
      slug: 'acme',
      plan: 'free',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { members: 1 },
    });
    const prisma = {
      workspace: { findUnique: workspaceFindUnique, update: workspaceUpdate },
      user: { findUnique: jest.fn().mockResolvedValue({ name: 'Root', email: 'root@example.com' }) },
    };
    const { service, systemEvents } = buildService(prisma);

    const result = await service.setActiveStatus('admin-1', 'ws1', { isActive: false });

    expect(workspaceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ws1' }, data: { isActive: false } }),
    );
    expect(result.isActive).toBe(false);
    expect(systemEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'workspace.updated', workspaceId: 'ws1', userId: 'admin-1' }),
    );
  });
});
