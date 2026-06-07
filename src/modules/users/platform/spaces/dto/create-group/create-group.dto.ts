import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GroupSettingsDto } from './group-settings.dto';

export class SpaceSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GroupSettingsDto)
  group?: GroupSettingsDto;
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
