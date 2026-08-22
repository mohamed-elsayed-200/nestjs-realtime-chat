import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import {
  SpaceHistory,
  JoinApproval,
  PermissionLevel,
} from '../../../../../../common/types/enums';

export class GroupSettingsDto {
  @IsOptional()
  @IsEnum(JoinApproval)
  joinApproval?: JoinApproval;

  @IsOptional()
  @IsEnum(SpaceHistory)
  spaceHistory?: SpaceHistory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxMembers?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  messageExpiryDuration?: number;

  @IsOptional()
  @IsEnum(PermissionLevel)
  enableSignature?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  enableProtectContent?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  enableViewMembersCount?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  enableViewMembersList?: PermissionLevel;

  // Messages
  @IsOptional()
  @IsEnum(PermissionLevel)
  allowPoll?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowMention?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendText?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendGIF?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendSticker?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowReactionMessage?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendLink?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendImage?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendVideo?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendFile?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendVoice?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowSendAudio?: PermissionLevel;

  @IsOptional()
  @IsString()
  groupLink?: string;
}
