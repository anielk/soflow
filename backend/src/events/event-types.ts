import { AuditCategory } from '@prisma/client';

/**
 * Every event a call site can publish today. Adding a new one is: add the
 * constant here (with its category), publish it from the call site, done —
 * AuditService and ActivityService already listen for everything on the
 * shared channel, so neither needs a code change.
 *
 * Some brief-listed events (user.removed, creator.deleted, role.changed,
 * ai.provider_changed, storage.provider_changed) are defined here as future
 * hooks but not yet published anywhere — the underlying feature to trigger
 * them doesn't exist in the app yet. See Sprint 5D's "Known limitations".
 */
export const EVENT_TYPES = {
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_LOGO_CHANGED: 'workspace.logo_changed',
  SETTINGS_CHANGED: 'settings.changed',

  USER_INVITED: 'user.invited',
  USER_REMOVED: 'user.removed',
  ROLE_CHANGED: 'role.changed',

  CREATOR_CREATED: 'creator.created',
  CREATOR_DELETED: 'creator.deleted',

  MEDIA_UPLOADED: 'media.uploaded',
  MEDIA_DELETED: 'media.deleted',

  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_PASSWORD_CHANGED: 'auth.password_changed',

  NOTIFICATION_SENT: 'notification.sent',

  AI_PROVIDER_CHANGED: 'ai.provider_changed',
  STORAGE_PROVIDER_CHANGED: 'storage.provider_changed',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export const EVENT_CATEGORIES: Record<EventType, AuditCategory> = {
  [EVENT_TYPES.WORKSPACE_UPDATED]: AuditCategory.WORKSPACE,
  [EVENT_TYPES.WORKSPACE_LOGO_CHANGED]: AuditCategory.WORKSPACE,
  [EVENT_TYPES.SETTINGS_CHANGED]: AuditCategory.SETTINGS,

  [EVENT_TYPES.USER_INVITED]: AuditCategory.USER,
  [EVENT_TYPES.USER_REMOVED]: AuditCategory.USER,
  [EVENT_TYPES.ROLE_CHANGED]: AuditCategory.USER,

  [EVENT_TYPES.CREATOR_CREATED]: AuditCategory.CREATOR,
  [EVENT_TYPES.CREATOR_DELETED]: AuditCategory.CREATOR,

  [EVENT_TYPES.MEDIA_UPLOADED]: AuditCategory.MEDIA,
  [EVENT_TYPES.MEDIA_DELETED]: AuditCategory.MEDIA,

  [EVENT_TYPES.AUTH_LOGIN]: AuditCategory.AUTH,
  [EVENT_TYPES.AUTH_LOGOUT]: AuditCategory.AUTH,
  [EVENT_TYPES.AUTH_LOGIN_FAILED]: AuditCategory.SECURITY,
  [EVENT_TYPES.AUTH_PASSWORD_RESET]: AuditCategory.SECURITY,
  [EVENT_TYPES.AUTH_PASSWORD_CHANGED]: AuditCategory.SECURITY,

  [EVENT_TYPES.NOTIFICATION_SENT]: AuditCategory.NOTIFICATION,

  [EVENT_TYPES.AI_PROVIDER_CHANGED]: AuditCategory.SYSTEM,
  [EVENT_TYPES.STORAGE_PROVIDER_CHANGED]: AuditCategory.SYSTEM,
};
