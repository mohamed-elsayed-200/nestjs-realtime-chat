import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SocialMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  facebook?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  twitter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  instagram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  youtube?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tiktok?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  whatsapp?: string;
}
