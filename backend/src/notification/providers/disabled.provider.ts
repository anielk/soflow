import { Injectable, Logger } from '@nestjs/common';
import type { NotificationMessage, NotificationProvider } from '../notification.interface';
import { NotificationDeliveryException } from '../notification.exceptions';

/**
 * Selected by NotificationModule's factory when NOTIFICATION_DRIVER=disabled,
 * or when "smtp" was selected but SMTP_HOST was left blank — the safe
 * default for a demo/production host that hasn't been given a mail relay
 * yet. Never performs a DNS lookup or network connection: HealthService
 * checks `isConfigured` before it would otherwise call verifyConnection(),
 * so this provider only ever runs when something upstream still tries to
 * send or verify despite there being nothing configured.
 */
@Injectable()
export class DisabledNotificationProvider implements NotificationProvider {
  readonly isConfigured = false;
  private readonly logger = new Logger(DisabledNotificationProvider.name);

  async send(message: NotificationMessage): Promise<void> {
    const recipients = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    this.logger.warn(`Notification provider is disabled — dropped "${message.subject}" to ${recipients}.`);
    throw new NotificationDeliveryException(
      'Notifications are disabled on this instance. Set NOTIFICATION_DRIVER=smtp and configure SMTP_HOST to enable them.',
    );
  }

  async verifyConnection(): Promise<void> {
    throw new NotificationDeliveryException('Notifications are disabled on this instance.');
  }
}
