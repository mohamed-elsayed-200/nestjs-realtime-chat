import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangeChannelInfoDto {
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
}
