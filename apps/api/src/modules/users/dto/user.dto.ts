import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MembershipRole } from '@prisma/client';

export class InviteUserDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsOptional() @IsEnum(MembershipRole) role?: MembershipRole;
  @IsOptional() @IsString() teamId?: string;
}

export class UpdateMembershipDto {
  @IsOptional() @IsEnum(MembershipRole) role?: MembershipRole;
  @IsOptional() @IsArray() @IsString({ each: true }) permissions?: string[];
  @IsOptional() @IsString() teamId?: string;
}
