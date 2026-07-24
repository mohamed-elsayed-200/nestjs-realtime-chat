import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  JoinApproval,
  PermissionLevel,
} from '../../../../../../common/types/enums';

class CommunityCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  spaces?: string[];
}

export class CommunitySettingsDto {
  @IsOptional()
  @IsString()
  communityLink?: string;

  @IsOptional()
  @IsEnum(JoinApproval)
  joinApproval?: JoinApproval;

  @IsOptional()
  @IsNumber()
  maxMembers?: number;

  @IsOptional()
  @IsEnum(PermissionLevel)
  enableViewMembersCount?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  enableViewMembersList?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowCreateSpace?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowInvite?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowEditInfo?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowDelete?: PermissionLevel;

  @IsOptional()
  @IsEnum(PermissionLevel)
  allowBanMember?: PermissionLevel;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunityCategoryDto)
  categories?: CommunityCategoryDto[];
}
