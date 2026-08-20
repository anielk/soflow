import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemEventsService } from '../events/system-events.service';

/**
 * Proves the P1 "forbidden attempts disappear after a 403" gap is closed
 * for AuditController's hand-rolled `assertSuperAdmin` check (it doesn't go
 * through RolesGuard — see roles.guard.spec.ts for that path instead): a
 * non-SUPER_ADMIN caller hitting an admin-only audit route both gets a 403
 * AND generates a SECURITY_FORBIDDEN event on the same append-only pipeline
 * every other audit event uses.
 */
describe('AuditController — forbidden admin routes publish SECURITY_FORBIDDEN', () => {
  let app: INestApplication;
  const publish = jest.fn();
  const getCategories = jest.fn().mockReturnValue({ categories: ['AUTH'] });

  function overrideUser(role: string) {
    return {
      canActivate: (ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        req.user = { userId: 'user-1', role };
        return true;
      },
    };
  }

  beforeEach(async () => {
    publish.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        { provide: AuditService, useValue: { findMany: jest.fn(), resolveOwnWorkspaceId: jest.fn() } },
        { provide: SystemEventsService, useValue: { publish } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(overrideUser('USER'))
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: [''] });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 403 and publishes SECURITY_FORBIDDEN for a non-super-admin caller', async () => {
    await request(app.getHttpServer()).get('/v1/audit/categories').expect(403);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'security.forbidden',
        userId: 'user-1',
        metadata: expect.objectContaining({
          path: '/v1/audit/categories',
          requiredRoles: ['SUPER_ADMIN'],
          actualRole: 'USER',
          reason: 'super_admin_check',
        }),
      }),
    );
  });
});
