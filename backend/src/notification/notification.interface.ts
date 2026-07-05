/**
 * Every notification channel (SMTP today; Teams, Slack, Discord, push, SMS,
 * CPOS alerts later) implements this same contract. Nothing outside this
 * module should ever import a concrete provider directly — always depend on
 * NotificationService.
 */
export interface NotificationMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Overrides the provider's configured default reply-to for this one message. */
  replyTo?: string;
}

export interface NotificationProvider {
  send(message: NotificationMessage): Promise<void>;
  /** Confirms the provider can actually reach its backend (e.g. SMTP handshake) — used by the Communication settings "Test Email" flow. */
  verifyConnection(): Promise<void>;
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');

/**
 * A template renders one specific email from a typed data shape. Templates
 * live outside controllers/services so call sites never build HTML strings
 * themselves — they pass data in and get a message out.
 */
export interface NotificationTemplate<T> {
  /** Stable identifier used in logs — not shown to recipients. */
  id: string;
  subject(data: T): string;
  html(data: T): string;
  /** Optional plain-text part; NotificationService derives one from `html` if omitted. */
  text?(data: T): string;
}
