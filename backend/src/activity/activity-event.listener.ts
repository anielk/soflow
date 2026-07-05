import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SYSTEM_EVENT_CHANNEL, SystemEvent } from '../events/system-event.interface';
import { ActivityService } from './activity.service';

@Injectable()
export class ActivityEventListener {
  constructor(private readonly activityService: ActivityService) {}

  @OnEvent(SYSTEM_EVENT_CHANNEL)
  handle(event: SystemEvent): void {
    void this.activityService.record(event);
  }
}
