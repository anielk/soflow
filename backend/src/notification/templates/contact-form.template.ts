import type { NotificationTemplate } from '../notification.interface';
import { renderLayout, stripHtml } from './layout';

export interface ContactFormEmailData {
  name: string;
  email: string;
  message: string;
}

/** Internal notification sent to the Leinaflow team, not to the sender. */
export const contactFormTemplate: NotificationTemplate<ContactFormEmailData> = {
  id: 'contact-form',
  subject: (data) => `New contact form message from ${data.name}`,
  html: (data) => {
    const body = `
      <h1 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#F5F5F7;">New contact message</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td style="padding:4px 0;color:#9A9AA6;width:90px;">Name</td><td style="padding:4px 0;">${data.name}</td></tr>
        <tr><td style="padding:4px 0;color:#9A9AA6;">Email</td><td style="padding:4px 0;">${data.email}</td></tr>
      </table>
      <p style="margin:16px 0 0 0;white-space:pre-wrap;">${data.message}</p>
    `;
    return renderLayout(body, { eyebrow: 'Contact form' });
  },
  text: (data) => stripHtml(`New contact message — Name: ${data.name}, Email: ${data.email}. ${data.message}`),
};
