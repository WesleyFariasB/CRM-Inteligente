import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AutomationStatus } from '@prisma/client';
export class CreateAutomationDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsString() @MaxLength(100) trigger!: string;
  @IsOptional() @IsArray() conditions?: Record<string, unknown>[];
  @IsOptional() @IsArray() actions?: Record<string, unknown>[];
  @IsOptional() @IsEnum(AutomationStatus) status?: AutomationStatus;
}
export class UpdateAutomationDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(100) trigger?: string;
  @IsOptional() @IsArray() conditions?: Record<string, unknown>[];
  @IsOptional() @IsArray() actions?: Record<string, unknown>[];
  @IsOptional() @IsEnum(AutomationStatus) status?: AutomationStatus;
}
