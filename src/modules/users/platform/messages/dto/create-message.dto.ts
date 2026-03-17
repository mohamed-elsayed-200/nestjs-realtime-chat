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

export class CreateMessageDto {
  @IsString({ message: 'messages.validation.name.isString' })
  @IsNotEmpty({ message: 'messages.validation.name.isNotEmpty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'messages.validation.description.isString' })
  description?: string;

  @IsOptional()
  @IsEnum(ActivationStatus)
  status?: ActivationStatus;

  @IsOptional()
  @IsString({ message: 'categories.validation.thumbnail.isUrl' })
  thumbnail?: string;
}
