import { IsArray, IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class PinMessageDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  messages: string[];

  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsMongoId()
  @IsNotEmpty()
  callId: string;

  @IsBoolean()
  @IsNotEmpty()
  isPinned: Boolean;
}
