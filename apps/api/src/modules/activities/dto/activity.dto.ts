import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActivityStatus, ActivityType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class CreateActivityDto {
  @IsEnum(ActivityType) type!: ActivityType;
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsDateString() scheduledAt!: string;
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() opportunityId?: string;
  @IsOptional() @IsDateString() reminderAt?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) participants?: string[];
}
export class UpdateActivityDto {
  @IsOptional() @IsEnum(ActivityType) type?: ActivityType;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() opportunityId?: string;
  @IsOptional() @IsDateString() reminderAt?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) participants?: string[];
  @IsOptional() @IsEnum(ActivityStatus) status?: ActivityStatus;
  @IsOptional() @IsString() @MaxLength(5000) result?: string;
}
export class ActivityQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(ActivityType) type?: ActivityType;
  @IsOptional() @IsEnum(ActivityStatus) status?: ActivityStatus;
}
