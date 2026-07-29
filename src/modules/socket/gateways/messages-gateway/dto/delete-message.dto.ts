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
  space: string;

  @IsBoolean()
  @IsOptional()
  everybody: boolean;
}
