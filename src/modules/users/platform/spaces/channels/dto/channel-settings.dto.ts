import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import {
  ChatHistory,
  JoinApproval,
  WhoCanComment,
} from '../../../../../../common/types/enums';

export class ChannelSettingsDto {
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
  @IsBoolean()
  addSignature?: boolean;

  @IsOptional()
  @IsBoolean()
  hideSubscribersCount?: boolean;

  @IsOptional()
  @IsBoolean()
  preventForwarding?: boolean;

  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

  @IsOptional()
  @IsMongoId()
  linkedDiscussionGroup?: string;

  @IsOptional()
  @IsEnum(WhoCanComment)
  whoCanComment?: WhoCanComment;

  @IsOptional()
  @IsBoolean()
  commentsRestrictUrls?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictMedia?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictStickers?: boolean;
}
