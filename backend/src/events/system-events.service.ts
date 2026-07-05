import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SYSTEM_EVENT_CHANNEL, SystemEvent } from './system-event.interface';

/**
 * The only thing call sites talk to for publishing an event. It knows
 * nothing about audit logs, activity feeds, or any other subscriber — those
 * are independent listeners (see AuditEventListener / ActivityEventListener)
 * that happen to be interested in the same channel. A future module can
 * subscribe to the exact same events (e.g. a real-time websocket feed, a
 * future CPOS relay) without this service or any publisher changing.
 *
 * `EventEmitter2.emit()` is synchronous but fire-and-forget: it invokes
 * listeners in-process without the caller awaiting their work, so a slow or
 * failing listener (e.g. a DB write) never adds latency to the request that
 * published the event. That's deliberate — see the "must not noticeably
 * slow requests" requirement. If this ever needs to cross a process
 * boundary (a real queue), only this service and EventsModule change.
 */
@Injectable()
export class SystemEventsService {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(event: SystemEvent): void {
    this.emitter.emit(SYSTEM_EVENT_CHANNEL, event);
  }
}
