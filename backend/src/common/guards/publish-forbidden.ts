import { SystemEventsService } from '../../events/system-events.service';
import { EVENT_TYPES } from '../../events/event-types';

/**
 * Shared shape for every SECURITY_FORBIDDEN event, published from the two
 * places an authorization denial happens today: RolesGuard (role-based
 * routes) and the hand-rolled `assertSuperAdmin` checks in AuditController/
 * SystemController/NotificationController (routes that gate on SUPER_ADMIN
 * without going through RolesGuard). One function so both paths record the
 * same fields instead of drifting — no `message`, same as AUTH_LOGIN_FAILED,
 * since a forbidden request is audited but intentionally never surfaced in
 * the human-facing activity feed.
 */
export function publishForbidden(
  systemEvents: SystemEventsService,
  req: any,
  requiredRoles: string[],
  reason: string,
): void {
  const user = req?.user as { userId?: string; role?: string } | undefined;
  systemEvents.publish({
    type: EVENT_TYPES.SECURITY_FORBIDDEN,
    userId: user?.userId,
    targetType: 'Route',
    targetId: req?.path,
    ipAddress: req?.ip,
    userAgent: req?.headers?.['user-agent'],
    metadata: {
      path: req?.path,
      method: req?.method,
      requiredRoles,
      actualRole: user?.role ?? null,
      reason,
    },
  });
}
