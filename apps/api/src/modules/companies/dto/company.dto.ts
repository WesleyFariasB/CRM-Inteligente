import { IsArray, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsOptional() @IsString() @MaxLength(180) legalName?: string;
  @IsOptional() @IsString() @MaxLength(40) document?: string;
  @IsOptional() @IsString() @MaxLength(100) segment?: string;
  @IsOptional() @IsString() @MaxLength(80) size?: string;
  @IsOptional() @IsString() @MaxLength(300) website?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @IsOptional() @IsString() ownerId?: string;
}

export class UpdateCompanyDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) name?: string;
  @IsOptional() @IsString() @MaxLength(180) legalName?: string;
  @IsOptional() @IsString() @MaxLength(40) document?: string;
  @IsOptional() @IsString() @MaxLength(100) segment?: string;
  @IsOptional() @IsString() @MaxLength(80) size?: string;
  @IsOptional() @IsString() @MaxLength(300) website?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @IsOptional() @IsString() ownerId?: string;
}

export class CompanyQueryDto extends PaginationQueryDto {}
