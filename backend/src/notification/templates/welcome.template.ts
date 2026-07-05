import type { NotificationTemplate } from '../notification.interface';
import { renderLayout, renderButton, stripHtml } from './layout';

export interface WelcomeEmailData {
  name: string;
  loginUrl: string;
}

export const welcomeTemplate: NotificationTemplate<WelcomeEmailData> = {
  id: 'welcome',
  subject: () => 'Welcome to Leinaflow',
  html: (data) => {
    const body = `
      <h1 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#F5F5F7;">Welcome, ${data.name}</h1>
      <p style="margin:0 0 4px 0;">Your Leinaflow account is ready. You can now sign in and start setting up your workspace.</p>
      ${renderButton('Go to Leinaflow', data.loginUrl)}
      <p style="margin:16px 0 0 0;color:#9A9AA6;">If you didn't create this account, you can safely ignore this email.</p>
    `;
    return renderLayout(body, { eyebrow: 'Welcome' });
  },
  text: (data) =>
    stripHtml(`Welcome, ${data.name}. Your Leinaflow account is ready — sign in at ${data.loginUrl}.`),
};
