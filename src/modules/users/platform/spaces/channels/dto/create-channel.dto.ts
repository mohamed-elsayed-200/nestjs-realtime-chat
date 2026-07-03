import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ChannelSettingsDto } from './channel-settings.dto';
import { Type } from 'class-transformer';

export class SpaceSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelSettingsDto)
  channel?: ChannelSettingsDto;
}

export class CreateChannelSpaceDto {
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
