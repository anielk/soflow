import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { NotificationService } from '../notification/notification.service';
import { welcomeTemplate } from '../notification/templates/welcome.template';
import { passwordResetTemplate } from '../notification/templates/password-reset.template';
import { SystemEventsService } from '../events/system-events.service';
import { EVENT_TYPES } from '../events/event-types';

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
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly systemEvents: SystemEventsService,
  ) {}

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
    const payload = { email: user.email, sub: user.id, role: user.role };
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
      access_token: this.jwtService.sign(payload),
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

  async register(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    let user: User;
    try {
      user = await this.usersService.create({ email, passwordHash: hashedPassword });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('An account with that email already exists.');
      }
      throw err;
    }

    // Registration succeeds regardless of whether the welcome email goes
    // out — a flaky mail server should never block account creation.
    this.notificationService
      .sendTemplate(user.email, welcomeTemplate, {
        name: user.name || user.username,
        loginUrl: `${this.frontendUrl()}/login`,
      })
      .catch((err) => this.logger.warn(`Welcome email failed for ${user.email}: ${errorMessage(err)}`));

    return user;
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
        resetUrl: `${this.frontendUrl()}/reset-password?token=${rawToken}`,
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

  private frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').replace(/\/$/, '');
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown error';
}
