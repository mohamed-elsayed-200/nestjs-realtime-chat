import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class ChangeInformationDto {
  @IsOptional()
  @IsString({ message: 'users.validation.name.isString' })
  name: string;

  @IsOptional()
  @IsString({ message: 'users.validation.name.isString' })
  username: string;

  @IsOptional()
  @IsBoolean({ message: 'users.validation.is2FA.isBoolean' })
  is2FA: boolean;

  @IsOptional()
  @IsString({ message: 'users.validation.name.isString' })
  dateOfBirth: string;

  @IsOptional()
  @IsString({ message: 'users.validation.bio.isString' })
  bio?: string;

  @IsString({ message: 'users.validation.profileColor.isString' })
  @IsOptional()
  profileColor?: string;

  @IsString({ message: 'users.validation.avatar.isString' })
  @IsOptional()
  avatar?: string;
}
