import type { NotificationTemplate } from '../notification.interface';
import { renderLayout, stripHtml } from './layout';

export interface GeneralNotificationData {
  title: string;
  message: string;
}

/** Generic fallback template — used today by the SMTP "Test Email" action; available for any future ad-hoc notification. */
export const generalNotificationTemplate: NotificationTemplate<GeneralNotificationData> = {
  id: 'general-notification',
  subject: (data) => data.title,
  html: (data) => {
    const body = `
      <h1 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#F5F5F7;">${data.title}</h1>
      <p style="margin:0;white-space:pre-wrap;">${data.message}</p>
    `;
    return renderLayout(body);
  },
  text: (data) => stripHtml(`${data.title}. ${data.message}`),
};
