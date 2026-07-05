import type { NotificationTemplate } from '../notification.interface';
import { renderLayout, renderButton, stripHtml } from './layout';

export interface InviteUserEmailData {
  recipientName: string;
  workspaceName: string;
  inviterName: string;
  loginUrl: string;
  /** Present only when a brand-new account was created for this invite. */
  temporaryEmail?: string;
  temporaryPassword?: string;
}

export const inviteUserTemplate: NotificationTemplate<InviteUserEmailData> = {
  id: 'invite-user',
  subject: (data) => `You've been added to ${data.workspaceName} on Leinaflow`,
  html: (data) => {
    const credentialsBlock = data.temporaryPassword
      ? `
        <p style="margin:16px 0 8px 0;">A new account was created for you. Use these credentials to sign in — you'll be able to change your password afterward.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#0B0B0F;border:1px solid #26262F;border-radius:8px;">
          <tr>
            <td style="padding:12px 16px;font-family:monospace;font-size:13px;color:#E5E5EA;">
              Email: ${data.temporaryEmail}<br />
              Temporary password: ${data.temporaryPassword}
            </td>
          </tr>
        </table>
      `
      : `<p style="margin:16px 0 0 0;">Sign in with your existing Leinaflow account to access it.</p>`;

    const body = `
      <h1 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#F5F5F7;">You're in, ${data.recipientName}</h1>
      <p style="margin:0 0 4px 0;">${data.inviterName} added you to the <strong>${data.workspaceName}</strong> workspace on Leinaflow.</p>
      ${credentialsBlock}
      ${renderButton('Sign in', data.loginUrl)}
    `;
    return renderLayout(body, { eyebrow: 'Workspace invite' });
  },
  text: (data) => {
    const creds = data.temporaryPassword
      ? ` Sign in with email ${data.temporaryEmail} and temporary password ${data.temporaryPassword}.`
      : '';
    return stripHtml(
      `${data.inviterName} added you to the ${data.workspaceName} workspace on Leinaflow.${creds} Sign in: ${data.loginUrl}`,
    );
  },
};
