import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreatePipelineDto, UpdatePipelineStageDto } from './dto/pipeline.dto';
import { PipelinesService } from './pipelines.service';

@ApiTags('Pipelines')
@ApiBearerAuth()
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}
  @Get() @RequirePermissions('leads:read') list(@CurrentActor() actor: AuthenticatedActor) {
    return this.pipelinesService.list(actor);
  }
  @Post() @RequirePermissions('pipelines:manage') create(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: CreatePipelineDto,
  ) {
    return this.pipelinesService.create(actor, dto);
  }
  @Patch('stages/:stageId') @RequirePermissions('pipelines:manage') updateStage(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('stageId') stageId: string,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    return this.pipelinesService.updateStage(actor, stageId, dto);
  }
}
