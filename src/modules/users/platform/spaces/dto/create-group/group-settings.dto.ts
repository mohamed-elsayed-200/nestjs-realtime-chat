// group-settings.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ChatHistory,
  JoinApproval,
  WhoCanAddMembers,
  WhoCanChangeInfo,
  WhoCanDeleteMessages,
  WhoCanPinMessages,
  WhoCanSendMessages,
} from 'src/common/types/enums';

export class GroupSettingsDto {
  @IsOptional()
  @IsEnum(JoinApproval)
  joinApproval?: JoinApproval;

  @IsOptional()
  @IsEnum(ChatHistory)
  chatHistory?: ChatHistory;

  @IsOptional()
  @IsBoolean()
  isSubscriptionRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCustomNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMentions?: boolean;

  @IsOptional()
  @IsBoolean()
  enablePolls?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxMembers?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  messageExpiryDuration?: number;

  @IsOptional()
  @IsEnum(WhoCanSendMessages)
  whoCanSendMessages?: WhoCanSendMessages;

  @IsOptional()
  @IsEnum(WhoCanAddMembers)
  whoCanAddMembers?: WhoCanAddMembers;

  @IsOptional()
  @IsEnum(WhoCanChangeInfo)
  whoCanChangeInfo?: WhoCanChangeInfo;

  @IsOptional()
  @IsEnum(WhoCanPinMessages)
  whoCanPinMessages?: WhoCanPinMessages;

  @IsOptional()
  @IsEnum(WhoCanDeleteMessages)
  whoCanDeleteMessages?: WhoCanDeleteMessages;

  @IsOptional()
  @IsBoolean()
  hideMembersList?: boolean;

  @IsOptional()
  @IsBoolean()
  restrictSendingUrls?: boolean;

  @IsOptional()
  @IsBoolean()
  restrictSendingMedia?: boolean;

  @IsOptional()
  @IsBoolean()
  restrictSendingStickers?: boolean;

  @IsOptional()
  @IsBoolean()
  slowModeEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  slowModeDelay?: number;

  @IsOptional()
  @IsBoolean()
  enableSlowModeWarning?: boolean;

  @IsOptional()
  @IsBoolean()
  enableVoiceChat?: boolean;

  @IsOptional()
  @IsString()
  groupLink?: string;
}
