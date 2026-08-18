import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { PrivacyValue } from '../../../../common/types/enums';
import { Type } from 'class-transformer';

export class UserPrivacyDto {
  @IsOptional()
  @IsEnum(PrivacyValue, { message: 'users.validation.privacy.email.isEnum' })
  email?: PrivacyValue;

  @IsOptional()
  @IsEnum(PrivacyValue, {
    message: 'users.validation.privacy.lastSeen.isEnum',
  })
  lastSeen?: PrivacyValue;

  @IsOptional()
  @IsEnum(PrivacyValue, {
    message: 'users.validation.privacy.profilePhoto.isEnum',
  })
  profilePhoto?: PrivacyValue;

  @IsOptional()
  @IsEnum(PrivacyValue, {
    message: 'users.validation.privacy.forwardedMessages.isEnum',
  })
  forwardedMessages?: PrivacyValue;

  @IsOptional()
  @IsEnum(PrivacyValue, { message: 'users.validation.privacy.invite.isEnum' })
  invite?: PrivacyValue;
}

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
  @IsString({ message: 'users.validation.passcodeLock.isString' })
  passcodeLock: string;

  @IsOptional()
  @IsString({ message: 'users.validation.passcodeLock.isString' })
  isPasscodeLocked: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => UserPrivacyDto)
  privacy?: UserPrivacyDto;
}
