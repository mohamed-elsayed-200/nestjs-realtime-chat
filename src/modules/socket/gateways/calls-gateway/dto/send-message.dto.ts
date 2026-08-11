import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsMongoId,
  IsArray,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Types } from 'mongoose';
import { MessageStatus, MessageType } from '../../../../../common/types/enums';

export class SendMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  callId: string;

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
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  stickerPack?: string;

  @IsOptional()
  @IsString()
  stickerId?: string;

  @IsOptional()
  @IsString()
  gifId?: string;

  @IsOptional()
  @IsString()
  gifPack?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  audioLevels?: number[];
}
