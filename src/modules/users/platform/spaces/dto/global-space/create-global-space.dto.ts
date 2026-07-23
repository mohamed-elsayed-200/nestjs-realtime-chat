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
import { GlobalSpaceSettingsDto } from './global-space-settings.dto';
import { Type } from 'class-transformer';
import { SpaceTypes, UserType } from 'src/common/types/enums';

export class SpaceSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GlobalSpaceSettingsDto)
  channel?: GlobalSpaceSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GlobalSpaceSettingsDto)
  group?: GlobalSpaceSettingsDto;
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
