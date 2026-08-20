import { IsString, IsObject } from 'class-validator';

export class UpdateCallSettingsDto {
  @IsString()
  spaceId: string;

  @IsString()
  callId: string;

  @IsObject()
  settings: Record<string, any>;
}
