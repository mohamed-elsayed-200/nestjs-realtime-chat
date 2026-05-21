import {
  IsOptional,
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsMongoId,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { SpaceTypes } from 'src/common/types/enums';

export class CreateSpaceDto {
  @IsOptional()
  @IsString({ message: 'spaces.validation.name.isString' })
  name: string;

  @IsNotEmpty({ message: 'spaces.validation.type.isEnum' })
  @IsEnum(SpaceTypes, { message: 'spaces.validation.type.isEnum' })
  type: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.description.isString' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'categories.validation.thumbnail.isUrl' })
  thumbnail?: string;

  @IsArray({ message: 'spaces.validation.members.isArray' })
  @ArrayNotEmpty({ message: 'spaces.validation.members.isNotEmpty' })
  @IsMongoId({ each: true, message: 'spaces.validation.members.isMongoId' })
  members: string[];
}
