import { IsString, IsOptional, IsBoolean } from 'class-validator';

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
  @IsString({ message: 'users.validation.phone.isString' })
  country: string;

  @IsOptional()
  @IsString({ message: 'users.validation.bio.isString' })
  headline?: string;

  @IsOptional()
  @IsString({ message: 'users.validation.bio.isString' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'users.validation.phone.isString' })
  phone?: string;
}
