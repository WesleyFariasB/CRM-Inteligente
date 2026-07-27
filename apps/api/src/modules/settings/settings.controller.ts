import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { UpdateOrganizationDto } from './dto/organization.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}
  @Get('organization') @RequirePermissions('settings:manage') get(
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.settingsService.get(actor);
  }
  @Patch('organization') @RequirePermissions('settings:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.settingsService.update(actor, dto);
  }
}
