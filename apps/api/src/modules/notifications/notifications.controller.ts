import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { NotificationsService } from './notifications.service';
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @Get() list(@CurrentActor() actor: AuthenticatedActor) {
    return this.notificationsService.list(actor);
  }
  @Patch(':id/read') markRead(@CurrentActor() actor: AuthenticatedActor, @Param('id') id: string) {
    return this.notificationsService.markRead(actor, id);
  }
  @Post('read-all') readAll(@CurrentActor() actor: AuthenticatedActor) {
    return this.notificationsService.markAllRead(actor);
  }
}
