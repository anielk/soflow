import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NOTIFICATION_PROVIDER } from './notification.interface';
import { NotificationService } from './notification.service';
import { SmtpProvider } from './providers/smtp.provider';
import { NotificationController } from './notification.controller';

/**
 * Wires NOTIFICATION_DRIVER to a concrete NotificationProvider. Only "smtp"
 * is implemented today. Adding teams/slack/discord/push/sms/coc later is a
 * new provider class implementing NotificationProvider plus one new case
 * here — no other module needs to change.
 */
@Module({
  imports: [ConfigModule],
  controllers: [NotificationController],
  providers: [
    SmtpProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      useFactory: (configService: ConfigService, smtpProvider: SmtpProvider) => {
        const driver = configService.get<string>('NOTIFICATION_DRIVER', 'smtp');
        switch (driver) {
          case 'smtp':
            return smtpProvider;
          default:
            throw new Error(
              `Notification driver "${driver}" is not implemented. Add a NotificationProvider for it and wire it into NotificationModule's factory.`,
            );
        }
      },
      inject: [ConfigService, SmtpProvider],
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
