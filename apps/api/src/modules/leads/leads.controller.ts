import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateLeadDto, LeadQueryDto, UpdateLeadDto } from './dto/lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermissions('leads:read')
  list(@CurrentActor() actor: AuthenticatedActor, @Query() query: LeadQueryDto) {
    return this.leadsService.list(actor, query);
  }

  @Get(':id')
  @RequirePermissions('leads:read')
  get(@CurrentActor() actor: AuthenticatedActor, @Param('id') id: string) {
    return this.leadsService.get(actor, id);
  }

  @Post()
  @RequirePermissions('leads:create')
  create(@CurrentActor() actor: AuthenticatedActor, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(actor, dto);
  }

  @Patch(':id')
  @RequirePermissions('leads:update')
  update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(actor, id, dto);
  }

  @Post(':id/convert')
  @RequirePermissions('leads:update')
  convert(@CurrentActor() actor: AuthenticatedActor, @Param('id') id: string) {
    return this.leadsService.convert(actor, id);
  }

  @Post(':id/restore')
  @RequirePermissions('leads:update')
  restore(@CurrentActor() actor: AuthenticatedActor, @Param('id') id: string) {
    return this.leadsService.restore(actor, id);
  }

  @Delete(':id')
  @RequirePermissions('leads:delete')
  archive(@CurrentActor() actor: AuthenticatedActor, @Param('id') id: string) {
    return this.leadsService.archive(actor, id);
  }
}
