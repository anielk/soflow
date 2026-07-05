import type { NotificationTemplate } from '../notification.interface';
import { renderLayout, renderButton, stripHtml } from './layout';

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export const passwordResetTemplate: NotificationTemplate<PasswordResetEmailData> = {
  id: 'password-reset',
  subject: () => 'Reset your Leinaflow password',
  html: (data) => {
    const body = `
      <h1 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#F5F5F7;">Reset your password</h1>
      <p style="margin:0 0 4px 0;">Hi ${data.name}, we received a request to reset your Leinaflow password.</p>
      ${renderButton('Reset password', data.resetUrl)}
      <p style="margin:16px 0 0 0;color:#9A9AA6;">This link expires in ${data.expiresInMinutes} minutes. If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `;
    return renderLayout(body, { eyebrow: 'Password reset' });
  },
  text: (data) =>
    stripHtml(
      `Hi ${data.name}, reset your Leinaflow password: ${data.resetUrl} (expires in ${data.expiresInMinutes} minutes). If you didn't request this, ignore this email.`,
    ),
};
