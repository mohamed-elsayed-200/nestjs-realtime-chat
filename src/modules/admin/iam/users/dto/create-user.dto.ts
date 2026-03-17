import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  IsMongoId,
  IsNumber,
  IsObject,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserType } from '../../../../../common/types/enums';
class LocationDto {
  @IsOptional()
  @IsString({ message: 'user.validation.location.city.isString' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'user.validation.location.state.isString' })
  state?: string;

  @IsOptional()
  @IsNumber({}, { message: 'user.validation.location.lat.isNumber' })
  lat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'user.validation.location.lng.isNumber' })
  lng?: number;
}

class SocialLinksDto {
  @IsOptional()
  @IsUrl({}, { message: 'user.validation.social.website.isUrl' })
  website?: string;

  @IsOptional()
  @IsUrl({}, { message: 'user.validation.social.linkedin.isUrl' })
  linkedin?: string;

  @IsOptional()
  @IsUrl({}, { message: 'user.validation.social.github.isUrl' })
  github?: string;

  @IsOptional()
  @IsUrl({}, { message: 'user.validation.social.twitter.isUrl' })
  twitter?: string;

  @IsOptional()
  @IsUrl({}, { message: 'user.validation.social.facebook.isUrl' })
  facebook?: string;
}

export class CreateUserDto {
  @IsString({ message: 'user.validation.name.isString' })
  @IsNotEmpty({ message: 'user.validation.name.isNotEmpty' })
  name: string;

  @IsEmail({}, { message: 'user.validation.email.invalid' })
  @IsNotEmpty({ message: 'user.validation.email.isNotEmpty' })
  email: string;

  @IsOptional()
  @IsString({ message: 'user.validation.username.isString' })
  username?: string;

  @IsOptional()
  @IsDateString({}, { message: 'user.validation.dateOfBirth.isDate' })
  dateOfBirth?: Date;

  @IsNotEmpty({ message: 'user.validation.password.isNotEmpty' })
  @MinLength(6, { message: 'user.validation.password.minLength' })
  password: string;

  @IsOptional()
  @IsString({ message: 'user.validation.phone.isString' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'user.validation.avatar.isString' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: 'user.validation.cover.isString' })
  cover?: string;

  @IsOptional()
  @IsString({ message: 'user.validation.profileColor.isString' })
  profileColor?: string;

  @IsOptional()
  @IsEnum(UserType, { message: 'user.validation.userType.isEnum' })
  userType?: UserType;

  @IsOptional()
  @IsArray({ message: 'user.validation.roles.isArray' })
  @IsMongoId({ each: true, message: 'user.validation.roles.isMongoId' })
  roles?: string[];

  @IsOptional()
  @IsString({ message: 'user.validation.bio.isString' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'user.validation.headline.isString' })
  headline?: string;

  @IsOptional()
  @IsString({ message: 'user.validation.country.isString' })
  country?: string;

  @IsOptional()
  @IsObject({ message: 'user.validation.location.isObject' })
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsObject({ message: 'user.validation.socialLinks.isObject' })
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @IsBoolean({ message: 'user.validation.is2FA.isBoolean' })
  is2FA?: boolean;
}
