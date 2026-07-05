import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SystemEventsService } from './system-events.service';

/**
 * Global so any module can inject SystemEventsService to publish without
 * importing EventsModule everywhere. Listeners (AuditEventListener,
 * ActivityEventListener) still live in their own modules — this module only
 * owns the publish side and the underlying in-process emitter.
 */
@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [SystemEventsService],
  exports: [SystemEventsService],
})
export class EventsModule {}
