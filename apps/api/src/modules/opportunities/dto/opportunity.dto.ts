import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { OpportunityStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class CreateOpportunityDto {
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @Type(() => Number) @IsNumber() @Min(0) value!: number;
  @IsString() pipelineId!: string;
  @IsString() stageId!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) probability?: number;
  @IsOptional() @IsDateString() expectedCloseDate?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() @MaxLength(100) source?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
}

export class UpdateOpportunityDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) value?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) probability?: number;
  @IsOptional() @IsDateString() expectedCloseDate?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() @MaxLength(100) source?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
}

export class MoveOpportunityDto {
  @IsString() stageId!: string;
}

export class OpportunityQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() pipelineId?: string;
  @IsOptional() @IsString() stageId?: string;
  @IsOptional() @IsEnum(OpportunityStatus) status?: OpportunityStatus;
}
