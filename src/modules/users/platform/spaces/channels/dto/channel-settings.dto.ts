import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  SpaceHistory,
  JoinApproval,
  WhoCanComment,
} from '../../../../../../common/types/enums';

export class ChannelSettingsDto {
  @IsOptional()
  @IsEnum(JoinApproval)
  joinApproval?: JoinApproval;

  @IsOptional()
  @IsEnum(SpaceHistory)
  spaceHistory?: SpaceHistory;

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
  @IsBoolean()
  enableReactions?: boolean;

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
  hideSubscribersList?: boolean;

  @IsOptional()
  @IsBoolean()
  protectContent?: boolean;

  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

  @IsOptional()
  @IsMongoId()
  linkedDiscussionGroup?: string;

  @IsOptional()
  @IsString()
  channelLink?: string;

  @IsOptional()
  @IsEnum(WhoCanComment)
  whoCanComment?: WhoCanComment;

  @IsOptional()
  @IsBoolean()
  commentsRestrictLinks?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictTexts?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictImages?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictGIFs?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictVideos?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictFiles?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictVoices?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictStickers?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictAudios?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsRestrictReactions?: boolean;
}
