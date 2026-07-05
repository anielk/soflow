import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SYSTEM_EVENT_CHANNEL, SystemEvent } from '../events/system-event.interface';
import { AuditService } from './audit.service';

/**
 * Subscribes to every published SystemEvent and records it. This is the
 * "future modules should publish events instead of directly coupling
 * services" decoupling in practice — nothing that publishes an event knows
 * or cares that AuditService exists.
 */
@Injectable()
export class AuditEventListener {
  constructor(private readonly auditService: AuditService) {}

  @OnEvent(SYSTEM_EVENT_CHANNEL)
  handle(event: SystemEvent): void {
    void this.auditService.record(event);
  }
}
