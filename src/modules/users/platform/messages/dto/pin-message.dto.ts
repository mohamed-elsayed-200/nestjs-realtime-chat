import { IsArray, IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class PinMessageDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  messages: Types.ObjectId[];

  @IsMongoId()
  @IsNotEmpty()
  space: Types.ObjectId;

  @IsBoolean()
  @IsNotEmpty()
  isPinned: Boolean;
}
