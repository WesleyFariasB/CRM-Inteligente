import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto, UpdateAutomationDto } from './dto/automation.dto';
@ApiTags('Automations')
@ApiBearerAuth()
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}
  @Get() @RequirePermissions('automations:manage') list(@CurrentActor() actor: AuthenticatedActor) {
    return this.automationsService.list(actor);
  }
  @Post() @RequirePermissions('automations:manage') create(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: CreateAutomationDto,
  ) {
    return this.automationsService.create(actor, dto);
  }
  @Patch(':id') @RequirePermissions('automations:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateAutomationDto,
  ) {
    return this.automationsService.update(actor, id, dto);
  }
  @Post(':id/run') @RequirePermissions('automations:manage') run(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.automationsService.run(actor, id);
  }
  @Get(':id/runs') @RequirePermissions('automations:manage') runs(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.automationsService.runs(actor, id);
  }
}
