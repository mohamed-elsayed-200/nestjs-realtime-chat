import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsMongoId,
  IsArray,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Types } from 'mongoose';
import { MessageStatus, MessageType } from '../../../../../common/types/enums';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  space: string;

  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType;

  @IsEnum(MessageStatus)
  @IsOptional()
  status?: MessageStatus;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsMongoId()
  replyTo?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  forwardFrom?: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  albumFiles?: string[];

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isEdited?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  stickerPack?: string;

  @IsOptional()
  @IsString()
  stickerId?: string;

  @IsOptional()
  @IsBoolean()
  isLottie?: boolean;

  @IsOptional()
  @IsString()
  gifId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}
