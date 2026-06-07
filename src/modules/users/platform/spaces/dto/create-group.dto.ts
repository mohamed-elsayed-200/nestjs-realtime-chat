import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ChatHistory,
  JoinApproval,
  WhoCanAddMembers,
  WhoCanChangeInfo,
  WhoCanDeleteMessages,
  WhoCanPinMessages,
  WhoCanSendMessages,
} from 'src/common/types/enums';

export class SpaceSettingsDto {
  // ── Permissions ──
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

  // ── Privacy & Access ──
  @IsOptional()
  @IsEnum(JoinApproval)
  joinApproval?: JoinApproval;

  @IsOptional()
  @IsEnum(ChatHistory)
  chatHistory?: ChatHistory;

  @IsOptional()
  @IsBoolean()
  hideMembersList?: boolean;

  @IsOptional()
  @IsBoolean()
  enablePolls?: boolean;

  @IsOptional()
  @IsBoolean()
  isSubscriptionRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCustomNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMentions?: boolean;

  // ── Content Restrictions ──
  @IsOptional()
  @IsBoolean()
  restrictSendingUrls?: boolean;

  @IsOptional()
  @IsBoolean()
  restrictSendingMedia?: boolean;

  @IsOptional()
  @IsBoolean()
  restrictSendingStickers?: boolean;

  // ── Slow Mode ──
  @IsOptional()
  @IsBoolean()
  slowModeEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(21600) // max 6 hours in seconds
  slowModeDelay?: number;

  @IsOptional()
  @IsBoolean()
  enableSlowModeWarning?: boolean;

  // ── Features ──
  @IsOptional()
  @IsBoolean()
  enableVoiceChat?: boolean;

  // ── Advanced ──
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxMembers?: number;

  @IsOptional()
  @IsString()
  groupLink?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  messageExpiryDuration?: number;
}

export class CreateGroupSpaceDto {
  @IsNotEmpty({ message: 'categories.validation.memberId.isNotEmpty' })
  @IsArray({ message: 'categories.validation.members.isArray' })
  @IsMongoId({ each: true, message: 'categories.validation.members.isMongoId' })
  members: string[];

  @IsNotEmpty({ message: 'spaces.validation.name.isNotEmpty' })
  @IsString({ message: 'spaces.validation.name.isString' })
  @MinLength(2, { message: 'spaces.validation.name.minLength' })
  @MaxLength(50, { message: 'spaces.validation.name.maxLength' })
  name: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.description.isString' })
  @MaxLength(200, { message: 'spaces.validation.description.maxLength' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.avatar.isString' })
  avatar?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpaceSettingsDto)
  settings?: Partial<SpaceSettingsDto>;
}
