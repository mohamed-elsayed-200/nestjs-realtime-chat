import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ActivationStatus } from '../../../../../common/types/enums';

export class CreateReactionDto {
  @IsString({ message: 'reactions.validation.name.isString' })
  @IsNotEmpty({ message: 'reactions.validation.name.isNotEmpty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'reactions.validation.description.isString' })
  description?: string;

  @IsOptional()
  @IsEnum(ActivationStatus)
  status?: ActivationStatus;

  @IsOptional()
  @IsString({ message: 'categories.validation.thumbnail.isUrl' })
  thumbnail?: string;
}
