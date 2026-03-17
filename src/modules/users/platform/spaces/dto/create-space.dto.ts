import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsArray,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { ActivationStatus } from '../../../../../common/types/enums';

export class CreateSpaceDto {
  @IsString({ message: 'spaces.validation.name.isString' })
  @IsNotEmpty({ message: 'spaces.validation.name.isNotEmpty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'spaces.validation.description.isString' })
  description?: string;

  @IsOptional()
  @IsEnum(ActivationStatus)
  status?: ActivationStatus;

  @IsOptional()
  @IsString({ message: 'categories.validation.thumbnail.isUrl' })
  thumbnail?: string;
}
