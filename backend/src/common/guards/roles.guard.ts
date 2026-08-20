import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SystemEventsService } from '../../events/system-events.service';
import { publishForbidden } from './publish-forbidden';

/**
 * Run after JwtAuthGuard (which populates req.user). A route with no
 * @Roles() decorator is allowed through unchanged — this guard only
 * restricts routes that explicitly opt in.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly systemEvents: SystemEventsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const { user } = req;
    if (!user || !requiredRoles.includes(user.role)) {
      publishForbidden(this.systemEvents, req, requiredRoles, user ? 'role_not_permitted' : 'unauthenticated');
      throw new ForbiddenException('You do not have permission to perform this action.');
    }
    return true;
  }
}
