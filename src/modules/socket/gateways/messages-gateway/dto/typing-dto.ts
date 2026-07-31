import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class TypingDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsMongoId()
  space: string;

  @IsOptional()
  @IsString({ message: 'user.validation.avatar.isString' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: 'user.validation.profileColor.isString' })
  profileColor?: string;

  @IsOptional()
  @IsString({ message: 'user.validation.updatedAt.isString' })
  updatedAt?: string;

  @IsString({ message: 'user.validation.name.isString' })
  @IsNotEmpty({ message: 'user.validation.name.isNotEmpty' })
  name: string;

  @IsNotEmpty()
  @IsBoolean()
  isTyping: boolean;
}
