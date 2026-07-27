import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PipelineStageInputDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) probability?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) maxDays?: number;
  @IsOptional() @IsBoolean() isWon?: boolean;
  @IsOptional() @IsBoolean() isLost?: boolean;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
}

export class CreatePipelineDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PipelineStageInputDto)
  stages!: PipelineStageInputDto[];
}

export class UpdatePipelineStageDto extends PipelineStageInputDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}
