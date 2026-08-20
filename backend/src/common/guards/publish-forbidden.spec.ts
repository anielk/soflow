import { publishForbidden } from './publish-forbidden';

describe('publishForbidden', () => {
  it('publishes a SECURITY_FORBIDDEN event with ip/user-agent/path/role for an authenticated but under-privileged caller', () => {
    const systemEvents = { publish: jest.fn() };
    const req = {
      user: { userId: 'user-1', role: 'USER' },
      path: '/v1/system/version',
      method: 'GET',
      ip: '203.0.113.9',
      headers: { 'user-agent': 'test-agent' },
    };

    publishForbidden(systemEvents as any, req, ['SUPER_ADMIN'], 'super_admin_check');

    expect(systemEvents.publish).toHaveBeenCalledWith({
      type: 'security.forbidden',
      userId: 'user-1',
      targetType: 'Route',
      targetId: '/v1/system/version',
      ipAddress: '203.0.113.9',
      userAgent: 'test-agent',
      metadata: {
        path: '/v1/system/version',
        method: 'GET',
        requiredRoles: ['SUPER_ADMIN'],
        actualRole: 'USER',
        reason: 'super_admin_check',
      },
    });
  });

  it('never includes a message field — forbidden attempts stay out of the human-facing activity feed', () => {
    const systemEvents = { publish: jest.fn() };
    publishForbidden(systemEvents as any, { user: { userId: 'u', role: 'USER' }, path: '/x', method: 'GET' }, ['SUPER_ADMIN'], 'x');

    expect(systemEvents.publish.mock.calls[0][0].message).toBeUndefined();
  });

  it('records userId: undefined and actualRole: null for a fully unauthenticated request', () => {
    const systemEvents = { publish: jest.fn() };
    publishForbidden(systemEvents as any, { path: '/v1/audit/categories', method: 'GET', ip: '198.51.100.1' }, ['SUPER_ADMIN'], 'unauthenticated');

    expect(systemEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined, metadata: expect.objectContaining({ actualRole: null }) }),
    );
  });
});
