import { Inject, Injectable, Logger } from '@nestjs/common';
import { NOTIFICATION_PROVIDER, NotificationMessage, NotificationProvider, NotificationTemplate } from './notification.interface';
import { NotificationDeliveryException } from './notification.exceptions';
import { stripHtml } from './templates/layout';
import { SystemEventsService } from '../events/system-events.service';
import { EVENT_TYPES } from '../events/event-types';

/**
 * The ONLY thing controllers and business logic should ever talk to for
 * sending a notification. It knows nothing about SMTP, Teams, Slack, or any
 * other channel — that's NotificationModule's job to wire up via
 * NOTIFICATION_PROVIDER. Swapping the provider, or adding a second one
 * later, never touches a call site.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(NOTIFICATION_PROVIDER) private readonly provider: NotificationProvider,
    private readonly systemEvents: SystemEventsService,
  ) {}

  async send(message: NotificationMessage): Promise<void> {
    const recipients = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    try {
      await this.provider.send(message);
      this.logger.log(`Sent "${message.subject}" to ${recipients}`);
      // No workspaceId/userId — many senders (demo request, contact form)
      // have no such context. Audit-only: this intentionally has no
      // `message`, so it never appears in the human-facing activity feed.
      this.systemEvents.publish({
        type: EVENT_TYPES.NOTIFICATION_SENT,
        targetType: 'Notification',
        metadata: { to: message.to, subject: message.subject },
      });
    } catch (err) {
      this.logger.error(`Failed to send "${message.subject}" to ${recipients}: ${errorMessage(err)}`);
      throw new NotificationDeliveryException();
    }
  }

  async sendTemplate<T>(to: string | string[], template: NotificationTemplate<T>, data: T, opts: { replyTo?: string } = {}): Promise<void> {
    const html = template.html(data);
    await this.send({
      to,
      subject: template.subject(data),
      html,
      text: template.text ? template.text(data) : stripHtml(html),
      replyTo: opts.replyTo,
    });
  }

  /** Confirms the configured provider is reachable — powers the Communication settings "Test Email" check. */
  async verifyConnection(): Promise<void> {
    try {
      await this.provider.verifyConnection();
    } catch (err) {
      this.logger.error(`Notification provider connection check failed: ${errorMessage(err)}`);
      throw new NotificationDeliveryException('Could not connect to the notification provider. Check your configuration.');
    }
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown error';
}
