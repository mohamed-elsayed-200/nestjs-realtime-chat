import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsMongoId,
  ValidateIf,
  IsObject,
} from 'class-validator';
import { MessageType, MessageStatus } from '../../../../../common/types/enums';

export class CreateMessageDto {
  @IsMongoId({ message: 'messages.validation.space.isMongoId' })
  @IsNotEmpty({ message: 'messages.validation.space.isNotEmpty' })
  space: string;

  @IsOptional()
  @IsEnum(MessageType, {
    message: 'messages.validation.type.isEnum',
  })
  messageType?: MessageType;

  @IsOptional()
  @IsString({ message: 'messages.validation.text.isString' })
  text?: string;

  @ValidateIf((o) =>
    [
      MessageType.IMAGE,
      MessageType.VIDEO,
      MessageType.AUDIO,
      MessageType.FILE,
    ].includes(o.type),
  )
  @IsString({ message: 'messages.validation.mediaUrl.isString' })
  @IsNotEmpty({ message: 'messages.validation.mediaUrl.isNotEmpty' })
  mediaUrl?: string;

  @IsOptional()
  @IsMongoId({ message: 'messages.validation.replyTo.isMongoId' })
  replyTo?: string;

  @IsOptional()
  @IsObject({ message: 'messages.validation.metadata.isObject' })
  metadata?: {
    fileName?: string;
    size?: number;
    duration?: number;
    width?: number;
    height?: number;
  };

  @IsOptional()
  @IsEnum(MessageStatus, {
    message: 'messages.validation.status.isEnum',
  })
  status?: MessageStatus;
}
