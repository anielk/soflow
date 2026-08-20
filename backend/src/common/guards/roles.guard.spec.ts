import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function buildContext(user: unknown, req: Record<string, any> = {}) {
  const request = { user, path: '/v1/system/version', method: 'GET', ip: '203.0.113.9', headers: { 'user-agent': 'test-agent' }, ...req };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

function buildGuard(requiredRoles: Role[] | undefined) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(requiredRoles) } as unknown as Reflector;
  const systemEvents = { publish: jest.fn() };
  const guard = new RolesGuard(reflector, systemEvents as any);
  return { guard, systemEvents };
}

describe('RolesGuard', () => {
  it('allows the request through when the route has no @Roles() at all', () => {
    const { guard } = buildGuard(undefined);
    expect(guard.canActivate(buildContext({ role: Role.USER }))).toBe(true);
  });

  it('denies a caller whose global role is not in the required list', () => {
    const { guard } = buildGuard([Role.SUPER_ADMIN]);
    expect(() => guard.canActivate(buildContext({ role: Role.USER }))).toThrow(ForbiddenException);
  });

  it('allows a caller whose global role matches', () => {
    const { guard } = buildGuard([Role.SUPER_ADMIN]);
    expect(guard.canActivate(buildContext({ role: Role.SUPER_ADMIN }))).toBe(true);
  });

  it('denies when there is no authenticated user on the request at all', () => {
    const { guard } = buildGuard([Role.SUPER_ADMIN]);
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });

  it('publishes a SECURITY_FORBIDDEN event with ip/user-agent/path/role when denying a wrong role', () => {
    const { guard, systemEvents } = buildGuard([Role.SUPER_ADMIN]);
    expect(() => guard.canActivate(buildContext({ userId: 'user-1', role: Role.USER }))).toThrow(ForbiddenException);

    expect(systemEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'security.forbidden',
        userId: 'user-1',
        ipAddress: '203.0.113.9',
        userAgent: 'test-agent',
        metadata: expect.objectContaining({
          path: '/v1/system/version',
          method: 'GET',
          requiredRoles: [Role.SUPER_ADMIN],
          actualRole: Role.USER,
          reason: 'role_not_permitted',
        }),
      }),
    );
  });

  it('publishes a SECURITY_FORBIDDEN event with no userId when the request is unauthenticated', () => {
    const { guard, systemEvents } = buildGuard([Role.SUPER_ADMIN]);
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);

    expect(systemEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'security.forbidden',
        userId: undefined,
        metadata: expect.objectContaining({ reason: 'unauthenticated' }),
      }),
    );
  });

  it('does not publish anything when access is allowed', () => {
    const { guard, systemEvents } = buildGuard([Role.SUPER_ADMIN]);
    guard.canActivate(buildContext({ role: Role.SUPER_ADMIN }));
    expect(systemEvents.publish).not.toHaveBeenCalled();
  });
});
