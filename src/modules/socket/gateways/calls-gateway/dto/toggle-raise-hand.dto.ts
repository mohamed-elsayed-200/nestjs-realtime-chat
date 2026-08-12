import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class ToggleRaiseHandDto {
  @IsMongoId()
  callId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
