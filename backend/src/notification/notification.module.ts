import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NOTIFICATION_PROVIDER } from './notification.interface';
import { NotificationService } from './notification.service';
import { SmtpProvider } from './providers/smtp.provider';
import { DisabledNotificationProvider } from './providers/disabled.provider';
import { NotificationController } from './notification.controller';

const logger = new Logger('NotificationModule');

/**
 * Wires NOTIFICATION_DRIVER to a concrete NotificationProvider. "smtp" is
 * the only implemented channel; "disabled" (and "smtp" with SMTP_HOST left
 * blank — a fresh demo/production install that hasn't set up a mail relay
 * yet) both resolve to DisabledNotificationProvider instead of ever
 * constructing a connection to an unconfigured host. Adding
 * teams/slack/discord/push/sms/coc later is a new provider class
 * implementing NotificationProvider plus one new case here — no other
 * module needs to change.
 */
@Module({
  imports: [ConfigModule],
  controllers: [NotificationController],
  providers: [
    SmtpProvider,
    DisabledNotificationProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      useFactory: (configService: ConfigService, smtpProvider: SmtpProvider, disabledProvider: DisabledNotificationProvider) => {
        const driver = configService.get<string>('NOTIFICATION_DRIVER', 'smtp');
        switch (driver) {
          case 'smtp':
            if (!smtpProvider.isConfigured) {
              logger.warn('NOTIFICATION_DRIVER=smtp but SMTP_HOST is blank — running with notifications disabled.');
              return disabledProvider;
            }
            return smtpProvider;
          case 'disabled':
            return disabledProvider;
          default:
            throw new Error(
              `Notification driver "${driver}" is not implemented. Add a NotificationProvider for it and wire it into NotificationModule's factory.`,
            );
        }
      },
      inject: [ConfigService, SmtpProvider, DisabledNotificationProvider],
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
