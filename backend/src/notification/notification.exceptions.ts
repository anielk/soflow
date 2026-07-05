import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * The only error shape NotificationService throws outward. The message is
 * always safe to show a client — provider details (SMTP host, credentials,
 * raw transport errors) are logged server-side and never included here.
 */
export class NotificationDeliveryException extends HttpException {
  constructor(message = 'Failed to send notification. Please try again later.') {
    super(message, HttpStatus.BAD_GATEWAY);
  }
}
