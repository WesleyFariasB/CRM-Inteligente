import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { InviteUserDto, UpdateMembershipDto } from './dto/user.dto';
import { UsersService } from './users.service';
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get() @RequirePermissions('users:manage') list(@CurrentActor() actor: AuthenticatedActor) {
    return this.usersService.list(actor);
  }
  @Post('invite') @RequirePermissions('users:manage') invite(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() dto: InviteUserDto,
  ) {
    return this.usersService.invite(actor, dto);
  }
  @Patch(':membershipId') @RequirePermissions('users:manage') update(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.usersService.updateMembership(actor, membershipId, dto);
  }
  @Delete(':membershipId') @RequirePermissions('users:manage') deactivate(
    @CurrentActor() actor: AuthenticatedActor,
    @Param('membershipId') membershipId: string,
  ) {
    return this.usersService.deactivate(actor, membershipId);
  }
}
