import { IsArray, IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class PinMessageDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  messages: string[];

  @IsMongoId()
  @IsNotEmpty()
  space: string;

  @IsBoolean()
  @IsNotEmpty()
  isPinned: Boolean;
}
