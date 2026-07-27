import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { TeamsService } from './teams.service';
@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}
  @Get() @RequirePermissions('users:manage') list(@CurrentActor() actor: AuthenticatedActor) {
    return this.teamsService.list(actor);
  }
  @Post() @RequirePermissions('users:manage') create(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: CreateTeamDto,
  ) {
    return this.teamsService.create(actor, dto);
  }
  @Patch(':id') @RequirePermissions('users:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(actor, id, dto);
  }
  @Delete(':id') @RequirePermissions('users:manage') archive(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.teamsService.archive(actor, id);
  }
}
