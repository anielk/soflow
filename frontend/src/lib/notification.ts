import { apiUrl, authHeaders, throwOnError } from './api';

export interface DemoRequestInput {
  name: string;
  email: string;
  company?: string;
  message?: string;
}

export async function submitDemoRequest(input: DemoRequestInput): Promise<void> {
  const response = await fetch(apiUrl('/notification/demo-request'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwOnError(response, 'Failed to send your demo request. Please try again.');
}

export interface ContactFormInput {
  name: string;
  email: string;
  message: string;
}

export async function submitContactForm(input: ContactFormInput): Promise<void> {
  const response = await fetch(apiUrl('/notification/contact-form'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwOnError(response, 'Failed to send your message. Please try again.');
}

export interface NotificationConfig {
  driver: string;
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUserConfigured: boolean;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  teamEmail: string;
}

export async function getNotificationConfig(): Promise<NotificationConfig> {
  const response = await fetch(apiUrl('/notification/config'), { headers: authHeaders(), cache: 'no-store' });
  await throwOnError(response, 'Failed to load communication settings');
  return response.json();
}

export async function sendTestEmail(): Promise<{ success: boolean; sentTo: string }> {
  const response = await fetch(apiUrl('/notification/test'), { method: 'POST', headers: authHeaders() });
  await throwOnError(response, 'Failed to send test email');
  return response.json();
}
