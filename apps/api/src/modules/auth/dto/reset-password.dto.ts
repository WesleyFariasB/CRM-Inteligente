import { IsString, MaxLength, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsString()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}
