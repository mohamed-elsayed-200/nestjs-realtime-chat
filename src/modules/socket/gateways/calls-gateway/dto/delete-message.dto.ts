import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';

export class DeleteMessageDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  messages: Types.ObjectId[];

  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsMongoId()
  @IsNotEmpty()
  callId: string;

  @IsBoolean()
  @IsOptional()
  everybody: boolean;
}
