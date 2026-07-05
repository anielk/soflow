import { Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { DemoRequestDto } from './dto/demo-request.dto';
import { ContactFormDto } from './dto/contact-form.dto';
import { demoRequestTemplate } from './templates/demo-request.template';
import { contactFormTemplate } from './templates/contact-form.template';
import { generalNotificationTemplate } from './templates/general-notification.template';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  private teamEmail(): string {
    return this.configService.get<string>('NOTIFICATION_TEAM_EMAIL', 'hello@leinaflow.com');
  }

  private assertSuperAdmin(req: any): void {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can manage communication settings.');
    }
  }

  @Post('demo-request')
  async demoRequest(@Body() dto: DemoRequestDto) {
    await this.notificationService.sendTemplate(this.teamEmail(), demoRequestTemplate, dto, { replyTo: dto.email });
    return { success: true };
  }

  @Post('contact-form')
  async contactForm(@Body() dto: ContactFormDto) {
    await this.notificationService.sendTemplate(this.teamEmail(), contactFormTemplate, dto, { replyTo: dto.email });
    return { success: true };
  }

  /** Read-only — never returns SMTP_PASSWORD. */
  @UseGuards(JwtAuthGuard)
  @Get('config')
  getConfig(@Req() req: any) {
    this.assertSuperAdmin(req);
    return {
      driver: this.configService.get<string>('NOTIFICATION_DRIVER', 'smtp'),
      smtpHost: this.configService.get<string>('SMTP_HOST', 'localhost'),
      smtpPort: this.configService.get<number>('SMTP_PORT', 587),
      smtpSecure: this.configService.get<boolean>('SMTP_SECURE', false),
      smtpUserConfigured: Boolean(this.configService.get<string>('SMTP_USER', '')),
      fromName: this.configService.get<string>('SMTP_FROM_NAME', 'Leinaflow'),
      fromEmail: this.configService.get<string>('SMTP_FROM_EMAIL', 'noreply@leinaflow.com'),
      replyTo: this.configService.get<string>('SMTP_REPLY_TO', '') || null,
      teamEmail: this.teamEmail(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('test')
  async sendTest(@Req() req: any) {
    this.assertSuperAdmin(req);
    await this.notificationService.verifyConnection();
    await this.notificationService.sendTemplate(req.user.email, generalNotificationTemplate, {
      title: 'Leinaflow test email',
      message: `This is a test email from your Leinaflow Communication settings, sent to confirm your SMTP configuration is working. Sent at ${new Date().toISOString()}.`,
    });
    return { success: true, sentTo: req.user.email };
  }
}
