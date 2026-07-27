import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}
  @Get() @RequirePermissions('leads:read') list(
    @CurrentActor() actor: AuthenticatedActor,
    @Query() query: TaskQueryDto,
  ) {
    return this.tasksService.list(actor, query);
  }
  @Post() @RequirePermissions('tasks:manage') create(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(actor, dto);
  }
  @Patch(':id') @RequirePermissions('tasks:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(actor, id, dto);
  }
  @Post(':id/complete') @RequirePermissions('tasks:manage') complete(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.tasksService.complete(actor, id);
  }
  @Post(':id/reopen') @RequirePermissions('tasks:manage') reopen(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.tasksService.reopen(actor, id);
  }
  @Delete(':id') @RequirePermissions('tasks:manage') archive(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.tasksService.archive(actor, id);
  }
}
