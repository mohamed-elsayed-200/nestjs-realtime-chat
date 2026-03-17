import { IsString, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'account.validation.oldPassword.isNotEmpty' })
  @IsString({ message: 'account.validation.oldPassword.isString' })
  oldPassword: string;

  @IsNotEmpty({ message: 'account.validation.newPassword.isNotEmpty' })
  @IsString({ message: 'account.validation.newPassword.isString' })
  newPassword: string;
}
