import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
    const userUpdate = jest.fn().mockResolvedValue({});
    const tx = {
      workspace: { create: workspaceCreate, findUnique: workspaceFindUnique },
      workspaceMember: { create: memberCreate },
      user: { update: userUpdate },
    };
    const prisma = {
      $transaction: jest.fn((cb: any) => cb(tx)),
      user: { findUnique: jest.fn().mockResolvedValue({ name: 'Ada', email: 'ada@example.com' }) },
    };

    const { service, systemEvents } = buildService(prisma);
    const result = await service.create('user-1', { name: 'Acme' });

    expect(workspaceCreate).toHaveBeenCalledWith({ data: { name: 'Acme', slug: 'acme' } });
    expect(memberCreate).toHaveBeenCalledWith({ data: { workspaceId: 'ws1', userId: 'user-1', role: Role.OWNER } });
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { activeWorkspaceId: 'ws1' } });
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

describe('WorkspaceService.resolveMembership', () => {
  it('prefers the active workspace membership over the oldest one when both exist', async () => {
    const findUnique = jest.fn().mockResolvedValue({ workspaceId: 'ws-active', role: Role.MANAGER });
    const findFirst = jest.fn(); // must never be reached — active membership found first
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ activeWorkspaceId: 'ws-active' }) },
      workspaceMember: { findUnique, findFirst },
    };
    const { service } = buildService(prisma);

    const result = await service.resolveMembership('user-1');

    expect(findUnique).toHaveBeenCalledWith({ where: { workspaceId_userId: { workspaceId: 'ws-active', userId: 'user-1' } } });
    expect(findFirst).not.toHaveBeenCalled();
    expect(result).toEqual({ workspaceId: 'ws-active', role: Role.MANAGER });
  });

  it('falls back to the oldest membership when activeWorkspaceId is null', async () => {
    const findFirst = jest.fn().mockResolvedValue({ workspaceId: 'ws-oldest', role: Role.OWNER });
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ activeWorkspaceId: null }) },
      workspaceMember: { findFirst },
    };
    const { service } = buildService(prisma);

    const result = await service.resolveMembership('user-1');

    expect(result).toEqual({ workspaceId: 'ws-oldest', role: Role.OWNER });
  });

  it('falls back to the oldest membership when activeWorkspaceId points at a workspace the caller was removed from', async () => {
    const findUnique = jest.fn().mockResolvedValue(null); // not a member of the stored active workspace anymore
    const findFirst = jest.fn().mockResolvedValue({ workspaceId: 'ws-oldest', role: Role.USER });
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ activeWorkspaceId: 'ws-stale' }) },
      workspaceMember: { findUnique, findFirst },
    };
    const { service } = buildService(prisma);

    const result = await service.resolveMembership('user-1');

    expect(result).toEqual({ workspaceId: 'ws-oldest', role: Role.USER });
  });

  it('throws ForbiddenException for a caller with no membership at all', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ activeWorkspaceId: null }) },
      workspaceMember: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const { service } = buildService(prisma);

    await expect(service.resolveMembership('user-1')).rejects.toThrow(ForbiddenException);
  });
});

describe('WorkspaceService.listMine', () => {
  it('lists every workspace the caller belongs to and marks the active one', async () => {
    const memberships = [
      { role: Role.OWNER, workspace: { id: 'ws1', name: 'Acme', slug: 'acme', logoUrl: null } },
      { role: Role.USER, workspace: { id: 'ws2', name: 'Beta', slug: 'beta', logoUrl: 'logo-key' } },
    ];
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ activeWorkspaceId: 'ws2' }) },
      workspaceMember: { findMany: jest.fn().mockResolvedValue(memberships) },
    };
    const { service } = buildService(prisma);

    const result = await service.listMine('user-1');

    expect(result).toEqual([
      { id: 'ws1', name: 'Acme', slug: 'acme', hasLogo: false, role: Role.OWNER, isActive: false },
      { id: 'ws2', name: 'Beta', slug: 'beta', hasLogo: true, role: Role.USER, isActive: true },
    ]);
  });

  it('falls back to the oldest membership as active when activeWorkspaceId is null', async () => {
    const memberships = [
      { workspaceId: 'ws1', role: Role.OWNER, workspace: { id: 'ws1', name: 'Acme', slug: 'acme', logoUrl: null } },
    ];
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ activeWorkspaceId: null }) },
      workspaceMember: { findMany: jest.fn().mockResolvedValue(memberships) },
    };
    const { service } = buildService(prisma);

    const result = await service.listMine('user-1');

    expect(result[0].isActive).toBe(true);
  });
});

describe('WorkspaceService.switchActiveWorkspace', () => {
  it('activates a workspace the caller is a real member of', async () => {
    const membershipFindUnique = jest.fn().mockResolvedValue({ workspaceId: 'ws2', userId: 'user-1', role: Role.USER });
    const userUpdate = jest.fn().mockResolvedValue({});
    const workspace = {
      id: 'ws2',
      name: 'Beta',
      slug: 'beta',
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
    const prisma = {
      workspaceMember: { findUnique: membershipFindUnique },
      user: { update: userUpdate },
      workspace: { findUniqueOrThrow: jest.fn().mockResolvedValue(workspace) },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };
    const { service } = buildService(prisma);

    const result = await service.switchActiveWorkspace('user-1', 'ws2');

    expect(membershipFindUnique).toHaveBeenCalledWith({ where: { workspaceId_userId: { workspaceId: 'ws2', userId: 'user-1' } } });
    expect(result.id).toBe('ws2');
  });

  it('rejects switching to a workspace the caller is not a member of — even a real, existing workspace id', async () => {
    const prisma = {
      workspaceMember: { findUnique: jest.fn().mockResolvedValue(null) }, // real workspace, but caller has no membership row
      user: { update: jest.fn() },
      workspace: { findUniqueOrThrow: jest.fn() },
      $transaction: jest.fn(),
    };
    const { service } = buildService(prisma);

    await expect(service.switchActiveWorkspace('user-1', 'someone-elses-workspace')).rejects.toThrow(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects a crafted/nonexistent workspace id the same way — no membership row means no activation regardless of why', async () => {
    const prisma = {
      workspaceMember: { findUnique: jest.fn().mockResolvedValue(null) },
      user: { update: jest.fn() },
      workspace: { findUniqueOrThrow: jest.fn() },
      $transaction: jest.fn(),
    };
    const { service } = buildService(prisma);

    await expect(service.switchActiveWorkspace('user-1', 'not-a-real-id')).rejects.toThrow(ForbiddenException);
  });
});
