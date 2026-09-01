import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, User, Workspace } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { NotificationService } from '../notification/notification.service';
import { welcomeTemplate } from '../notification/templates/welcome.template';
import { passwordResetTemplate } from '../notification/templates/password-reset.template';
import { SystemEventsService } from '../events/system-events.service';
import { EVENT_TYPES } from '../events/event-types';
import { ServiceConfigService } from '../config/service-config.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { uniqueWorkspaceSlug } from '../workspace/workspace-slug.util';

const RESET_TOKEN_TTL_MINUTES = 15;

// A precomputed bcrypt hash with no matching password, compared against when
// no user is found so unknown-email and wrong-password logins take the same
// time — otherwise skipping bcrypt for unknown emails leaks account existence.
const DUMMY_PASSWORD_HASH = '$2b$10$aInybw7eA81LAjVTzZHNF.NaHcVBGr8s2WmN0.P8UACrMs4MIzzyC';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly serviceConfig: ServiceConfigService,
    private readonly systemEvents: SystemEventsService,
  ) {}

  private signToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    return this.jwtService.sign({ email: user.email, sub: user.id, role: user.role });
  }

  async validateUser(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    const passwordValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!user || !passwordValid) {
      // No `message` — failed logins are audited but intentionally never
      // shown in the human-facing activity feed.
      this.systemEvents.publish({
        type: EVENT_TYPES.AUTH_LOGIN_FAILED,
        userId: user?.id,
        actorName: user ? user.name || user.email : email,
        targetType: 'User',
        targetId: user?.id,
        ipAddress,
        userAgent,
        metadata: { email },
      });
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: User, ipAddress?: string, userAgent?: string) {
    const actorName = user.name || user.email;
    this.systemEvents.publish({
      type: EVENT_TYPES.AUTH_LOGIN,
      userId: user.id,
      actorName,
      targetType: 'User',
      targetId: user.id,
      ipAddress,
      userAgent,
      message: `${actorName} logged in`,
    });
    return {
      access_token: this.signToken(user),
    };
  }

  async logout(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // JWTs are stateless here — there is no session to invalidate. This
    // exists purely to record that the user chose to log out.
    const user = await this.usersService.findByEmail(email);
    const actorName = user?.name || email;
    this.systemEvents.publish({
      type: EVENT_TYPES.AUTH_LOGOUT,
      userId,
      actorName,
      targetType: 'User',
      targetId: userId,
      ipAddress,
      userAgent,
      message: `${actorName} logged out`,
    });
  }

  /**
   * Registration is a "create your agency" flow, not a bare account signup:
   * every new user must land with a workspace of their own and OWNER
   * membership in it — otherwise every workspace-scoped endpoint
   * (dashboard, members, creators, media, ...) 403s with "not a member of
   * any workspace" the moment they log in. User + Workspace +
   * WorkspaceMember + activating that workspace are created in one
   * transaction so a failure partway through can never leave a user
   * without a workspace, a workspace without an owner, or a user whose
   * activeWorkspaceId points nowhere.
   */
  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<RegisterResponseDto> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let user: User;
    let workspace: Workspace;
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const username = await this.uniqueUsername(tx, dto.username);
        const txUser = await tx.user.create({
          data: {
            email: dto.email.trim().toLowerCase(),
            passwordHash: hashedPassword,
            username,
          },
        });

        const slug = await uniqueWorkspaceSlug(tx, dto.username);
        const txWorkspace = await tx.workspace.create({
          data: { name: dto.username.trim(), slug },
        });

        await tx.workspaceMember.create({
          data: { workspaceId: txWorkspace.id, userId: txUser.id, role: Role.OWNER },
        });

        const updatedUser = await tx.user.update({
          where: { id: txUser.id },
          data: { activeWorkspaceId: txWorkspace.id },
        });

        return { user: updatedUser, workspace: txWorkspace };
      });
      user = created.user;
      workspace = created.workspace;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('An account with that email already exists.');
      }
      throw err;
    }

    const actorName = user.name || user.username;
    this.systemEvents.publish({
      type: EVENT_TYPES.USER_REGISTERED,
      userId: user.id,
      workspaceId: workspace.id,
      actorName,
      targetType: 'User',
      targetId: user.id,
      message: `${actorName} created an account`,
      ipAddress,
      userAgent,
    });
    // Workspace creation during registration keeps its existing shape —
    // ipAddress/userAgent belong to the "someone registered" event above,
    // same as every other workspace-mutating event in the app (see
    // WorkspaceService.create/update/uploadLogo) never carrying them either.
    this.systemEvents.publish({
      type: EVENT_TYPES.WORKSPACE_CREATED,
      userId: user.id,
      workspaceId: workspace.id,
      actorName,
      targetType: 'Workspace',
      targetId: workspace.id,
      message: `${actorName} created workspace "${workspace.name}"`,
    });

    // Registration succeeds regardless of whether the welcome email goes
    // out — a flaky mail server should never block account creation.
    this.notificationService
      .sendTemplate(user.email, welcomeTemplate, {
        name: user.name || user.username,
        loginUrl: `${this.serviceConfig.frontendUrl()}/login`,
      })
      .catch((err) => this.logger.warn(`Welcome email failed for ${user.email}: ${errorMessage(err)}`));

    return { access_token: this.signToken(user) };
  }

  private async uniqueUsername(tx: Prisma.TransactionClient, seed: string): Promise<string> {
    const base = seed.trim().toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || 'user';
    let candidate = base;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await tx.user.findUnique({ where: { username: candidate } });
      if (!existing) return candidate;
      candidate = `${base}${randomBytes(3).toString('hex')}`;
    }
    throw new ConflictException('Could not generate a unique username — please try a different one.');
  }

  /** Always succeeds from the caller's perspective — never reveals whether the email exists. */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);
    await this.usersService.setResetToken(user.id, tokenHash, expiresAt);

    try {
      await this.notificationService.sendTemplate(user.email, passwordResetTemplate, {
        name: user.name || user.username,
        resetUrl: `${this.serviceConfig.frontendUrl()}/reset-password?token=${rawToken}`,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      });
    } catch (err) {
      this.logger.warn(`Password reset email failed for ${user.email}: ${errorMessage(err)}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetTokenHash(tokenHash);
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.clearResetTokenAndSetPassword(user.id, passwordHash);

    const actorName = user.name || user.email;
    this.systemEvents.publish({
      type: EVENT_TYPES.AUTH_PASSWORD_RESET,
      userId: user.id,
      actorName,
      targetType: 'User',
      targetId: user.id,
      message: `${actorName} reset their password`,
    });
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown error';
}
