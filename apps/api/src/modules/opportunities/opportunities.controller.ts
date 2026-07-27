import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import {
  CreateOpportunityDto,
  MoveOpportunityDto,
  OpportunityQueryDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';
import { OpportunitiesService } from './opportunities.service';

@ApiTags('Opportunities')
@ApiBearerAuth()
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}
  @Get() @RequirePermissions('leads:read') list(
    @CurrentActor() actor: AuthenticatedActor,
    @Query() query: OpportunityQueryDto,
  ) {
    return this.opportunitiesService.list(actor, query);
  }
  @Get(':id') @RequirePermissions('leads:read') get(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.opportunitiesService.get(actor, id);
  }
  @Post() @RequirePermissions('opportunities:manage') create(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: CreateOpportunityDto,
  ) {
    return this.opportunitiesService.create(actor, dto);
  }
  @Patch(':id') @RequirePermissions('opportunities:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.opportunitiesService.update(actor, id, dto);
  }
  @Post(':id/move') @RequirePermissions('opportunities:manage') move(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: MoveOpportunityDto,
  ) {
    return this.opportunitiesService.move(actor, id, dto);
  }
  @Delete(':id') @RequirePermissions('opportunities:manage') archive(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.opportunitiesService.archive(actor, id);
  }
}
