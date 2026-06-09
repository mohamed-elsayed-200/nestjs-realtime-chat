import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ActivationStatus } from '../../../../../common/types/enums';

export class CreateMemberDto {
  @IsString({ message: 'members.validation.name.isString' })
  @IsNotEmpty({ message: 'members.validation.name.isNotEmpty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'members.validation.bio.isString' })
  bio?: string;

  @IsOptional()
  @IsEnum(ActivationStatus)
  status?: ActivationStatus;

  @IsOptional()
  @IsString({ message: 'categories.validation.thumbnail.isUrl' })
  thumbnail?: string;
}
