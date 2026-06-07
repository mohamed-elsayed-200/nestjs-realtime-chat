import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFolderDto {
  @IsString({ message: 'folders.validation.name.isString' })
  @MinLength(1, { message: 'folders.validation.name.minLength' })
  @MaxLength(30, { message: 'folders.validation.name.maxLength' })
  name: string;

  @IsOptional()
  @IsString({ message: 'folders.validation.icon.isString' })
  icon?: string;

  @IsOptional()
  @IsString({ message: 'folders.validation.color.isString' })
  color?: string;
}
