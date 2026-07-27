import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ActivitiesService } from './activities.service';
import { ActivityQueryDto, CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}
  @Get() @RequirePermissions('leads:read') list(
    @CurrentActor() actor: AuthenticatedActor,
    @Query() query: ActivityQueryDto,
  ) {
    return this.activitiesService.list(actor, query);
  }
  @Post() @RequirePermissions('tasks:manage') create(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(actor, dto);
  }
  @Patch(':id') @RequirePermissions('tasks:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(actor, id, dto);
  }
  @Post(':id/complete') @RequirePermissions('tasks:manage') complete(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.activitiesService.complete(actor, id);
  }
  @Delete(':id') @RequirePermissions('tasks:manage') archive(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.activitiesService.archive(actor, id);
  }
}
