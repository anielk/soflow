import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthService } from './auth.service';

function buildService(overrides: { prisma?: any } = {}) {
  const systemEvents = { publish: jest.fn() };
  const usersService = { findByEmail: jest.fn() } as any;
  const jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') } as any;
  const notificationService = { sendTemplate: jest.fn().mockResolvedValue(undefined) } as any;
  const serviceConfig = { frontendUrl: () => 'http://localhost:3000' } as any;
  const prisma = overrides.prisma ?? {};

  const service = new AuthService(usersService, prisma, jwtService, notificationService, serviceConfig, systemEvents as any);
  return { service, systemEvents, usersService, jwtService, notificationService };
}

function buildTx() {
  const createdUser = { id: 'user-1', email: 'new@example.com', username: 'newagency', role: 'USER' };
  const createdWorkspace = { id: 'ws-1', name: 'newagency', slug: 'newagency' };
  return {
    tx: {
      user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(createdUser) },
      workspace: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(createdWorkspace) },
      workspaceMember: { create: jest.fn().mockResolvedValue({}) },
    },
    createdUser,
    createdWorkspace,
  };
}

describe('AuthService.register', () => {
  it('records the real client IP and user agent on the registration audit event, same shape as login', async () => {
    const { tx, createdUser, createdWorkspace } = buildTx();
    const prisma = { $transaction: jest.fn((cb: any) => cb(tx)) };
    const { service, systemEvents } = buildService({ prisma });

    await service.register(
      { email: 'new@example.com', password: 'testpass123', username: 'newagency' },
      '203.0.113.9',
      'Mozilla/5.0 test-agent',
    );

    expect(systemEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'user.registered',
        userId: createdUser.id,
        workspaceId: createdWorkspace.id,
        ipAddress: '203.0.113.9',
        userAgent: 'Mozilla/5.0 test-agent',
      }),
    );
  });

  it('still publishes WORKSPACE_CREATED unchanged (no ipAddress/userAgent on that event)', async () => {
    const { tx, createdWorkspace } = buildTx();
    const prisma = { $transaction: jest.fn((cb: any) => cb(tx)) };
    const { service, systemEvents } = buildService({ prisma });

    await service.register({ email: 'new@example.com', password: 'testpass123', username: 'newagency' }, '203.0.113.9', 'ua');

    const workspaceEvent = systemEvents.publish.mock.calls.find((call: any[]) => call[0].type === 'workspace.created');
    expect(workspaceEvent).toBeDefined();
    expect(workspaceEvent![0]).toEqual(
      expect.objectContaining({ type: 'workspace.created', workspaceId: createdWorkspace.id }),
    );
    expect(workspaceEvent![0].ipAddress).toBeUndefined();
    expect(workspaceEvent![0].userAgent).toBeUndefined();
  });

  it('works with no IP/user-agent at all (both optional, e.g. an internal/dev request)', async () => {
    const { tx } = buildTx();
    const prisma = { $transaction: jest.fn((cb: any) => cb(tx)) };
    const { service, systemEvents } = buildService({ prisma });

    await expect(
      service.register({ email: 'new@example.com', password: 'testpass123', username: 'newagency' }),
    ).resolves.toEqual({ access_token: 'signed-jwt' });

    const registeredEvent = systemEvents.publish.mock.calls.find((call: any[]) => call[0].type === 'user.registered');
    expect(registeredEvent![0].ipAddress).toBeUndefined();
    expect(registeredEvent![0].userAgent).toBeUndefined();
  });

  it('does not publish any audit event for a failed (duplicate email) registration', async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.22.0',
    });
    const prisma = { $transaction: jest.fn().mockRejectedValue(duplicateError) };
    const { service, systemEvents } = buildService({ prisma });

    await expect(
      service.register({ email: 'dup@example.com', password: 'testpass123', username: 'dupagency' }, '203.0.113.9', 'ua'),
    ).rejects.toThrow(ConflictException);

    expect(systemEvents.publish).not.toHaveBeenCalled();
  });
});

describe('AuthService.login', () => {
  it('continues to record the client IP and user agent on the login audit event', async () => {
    const prisma = {};
    const { service, systemEvents, jwtService } = buildService({ prisma });
    const user = { id: 'user-1', email: 'existing@example.com', name: null, role: 'USER' } as any;

    const result = await service.login(user, '203.0.113.9', 'Mozilla/5.0 test-agent');

    expect(systemEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth.login',
        userId: 'user-1',
        ipAddress: '203.0.113.9',
        userAgent: 'Mozilla/5.0 test-agent',
      }),
    );
    expect(result).toEqual({ access_token: 'signed-jwt' });
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
