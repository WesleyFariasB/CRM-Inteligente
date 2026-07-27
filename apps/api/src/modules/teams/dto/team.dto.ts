import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
export class CreateTeamDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() managerId?: string;
}
export class UpdateTeamDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() managerId?: string;
}
