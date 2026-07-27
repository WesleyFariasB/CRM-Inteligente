import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ContactsService } from './contacts.service';
import { ContactQueryDto, CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}
  @Get() @RequirePermissions('leads:read') list(
    @CurrentActor() actor: AuthenticatedActor,
    @Query() query: ContactQueryDto,
  ) {
    return this.contactsService.list(actor, query);
  }
  @Get(':id') @RequirePermissions('leads:read') get(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.contactsService.get(actor, id);
  }
  @Post() @RequirePermissions('contacts:manage') create(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(actor, dto);
  }
  @Patch(':id') @RequirePermissions('contacts:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(actor, id, dto);
  }
  @Delete(':id') @RequirePermissions('contacts:manage') archive(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    return this.contactsService.archive(actor, id);
  }
}
