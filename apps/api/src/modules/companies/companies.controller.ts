import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CompaniesService } from './companies.service';
import { CompanyQueryDto, CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}
  @Get() @RequirePermissions('leads:read') list(
    @CurrentActor() actor: AuthenticatedActor,
    @Query() query: CompanyQueryDto,
  ) {
    return this.companiesService.list(actor, query);
  }
  @Get(':id') @RequirePermissions('leads:read') get(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.companiesService.get(actor, id);
  }
  @Post() @RequirePermissions('companies:manage') create(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(actor, dto);
  }
  @Patch(':id') @RequirePermissions('companies:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(actor, id, dto);
  }
  @Delete(':id') @RequirePermissions('companies:manage') archive(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.companiesService.archive(actor, id);
  }
}
