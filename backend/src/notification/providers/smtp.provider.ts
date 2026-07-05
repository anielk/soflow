import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { NotificationMessage, NotificationProvider } from '../notification.interface';

@Injectable()
export class SmtpProvider implements NotificationProvider {
  private readonly logger = new Logger(SmtpProvider.name);
  private readonly transporter: Transporter;
  private readonly fromName: string;
  private readonly fromEmail: string;
  private readonly defaultReplyTo?: string;

  constructor(private readonly configService: ConfigService) {
    this.fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Leinaflow');
    this.fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'noreply@leinaflow.com');
    this.defaultReplyTo = this.configService.get<string>('SMTP_REPLY_TO', '') || undefined;

    const user = this.configService.get<string>('SMTP_USER', '');
    const password = this.configService.get<string>('SMTP_PASSWORD', '');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      // Most local/dev SMTP catchers (and some relays) don't require auth —
      // only attach credentials when both are actually configured.
      auth: user && password ? { user, pass: password } : undefined,
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: message.to,
      replyTo: message.replyTo ?? this.defaultReplyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }

  async verifyConnection(): Promise<void> {
    await this.transporter.verify();
  }
}
