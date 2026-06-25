import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class PrivateSettingsDto {
  @IsOptional()
  @IsBoolean()
  secretSpace?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  autoDeleteDuration?: number;

  @IsOptional()
  @IsBoolean()
  disappearingMessages?: boolean;
}
