import type { EventType } from './event-types';

/**
 * The one shape every publishable event takes. Deliberately a single
 * generic interface rather than one class per event — with 15+ event types
 * that would just be boilerplate, and both listeners (Audit, Activity) only
 * ever need these fields.
 */
export interface SystemEvent {
  type: EventType;
  workspaceId?: string;
  userId?: string;
  /** Denormalized display name of the actor, so activity/audit stay readable even if the user record changes or is removed later. */
  actorName?: string;
  targetType?: string;
  targetId?: string;
  /**
   * Human-readable sentence, e.g. "John uploaded red-clip.mp4". Only events
   * that should appear in the user-facing Activity feed set this — audit
   * always gets recorded regardless, activity only when this is present.
   */
  message?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/** The single in-process channel every SystemEvent is published on. */
export const SYSTEM_EVENT_CHANNEL = 'system.event';
