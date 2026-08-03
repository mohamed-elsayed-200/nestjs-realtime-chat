import {
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
import { ChannelSettingsDto } from '../../../../users/platform/spaces/dto/global-space/channel-settings.dto';
import { GroupSettingsDto } from '../../../../users/platform/spaces/dto/global-space/group-settings.dto';
import { SpaceTypes } from '../../../../../common/types/enums';
import { CommunitySettingsDto } from '../../../../users/platform/spaces/dto/global-space/community-settings.dto';

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

export class UpdateSpaceDto {
  @IsNotEmpty()
  @IsMongoId()
  spaceId: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.name.isString' })
  @MinLength(2, { message: 'spaces.validation.name.minLength' })
  @MaxLength(50, { message: 'spaces.validation.name.maxLength' })
  name: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.bio.isString' })
  @MaxLength(200, { message: 'spaces.validation.bio.maxLength' })
  bio?: string;

  @IsNotEmpty()
  @IsEnum(SpaceTypes, { message: 'user.validation.SpaceTypes.isEnum' })
  type: SpaceTypes;

  @IsOptional()
  @IsString({ message: 'spaces.validation.avatar.isString' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.avatar.isString' })
  wallpaper?: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.profileColor.isString' })
  profileColor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpaceSettingsDto)
  settings?: Partial<SpaceSettingsDto>;
}
