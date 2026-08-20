import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SpaceTypes, UserType } from '../../../../../common/types/enums';
import { GroupSettingsDto } from './group-settings.dto';
import { ChannelSettingsDto } from './channel-settings.dto';
import { CommunitySettingsDto } from './community-settings.dto';

export class SpaceSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelSettingsDto)
  channel?: ChannelSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GroupSettingsDto)
  group?: GroupSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CommunitySettingsDto)
  community?: CommunitySettingsDto;
}

export class CreateGlobalSpaceDto {
  @IsOptional({ message: 'categories.validation.memberId.isNotEmpty' })
  @IsArray({ message: 'categories.validation.members.isArray' })
  @IsMongoId({ each: true, message: 'categories.validation.members.isMongoId' })
  members: string[];

  @IsOptional()
  @IsEnum(SpaceTypes, { message: 'user.validation.userType.isEnum' })
  type?: UserType;

  @IsNotEmpty({ message: 'spaces.validation.name.isNotEmpty' })
  @IsString({ message: 'spaces.validation.name.isString' })
  @MinLength(2, { message: 'spaces.validation.name.minLength' })
  @MaxLength(50, { message: 'spaces.validation.name.maxLength' })
  name: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.bio.isString' })
  @MaxLength(200, { message: 'spaces.validation.bio.maxLength' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.avatar.isString' })
  avatar?: string;

  @IsOptional()
  @IsMongoId({ message: 'spaces.validation.avatar.isMongoId' })
  parentSpace?: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.profileColor.isString' })
  profileColor?: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.wallpaper.isString' })
  wallpaper?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpaceSettingsDto)
  settings?: Partial<SpaceSettingsDto>;
}
