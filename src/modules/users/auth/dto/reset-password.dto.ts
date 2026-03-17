import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'auth.validation.email.invalid' })
  @IsNotEmpty({ message: 'auth.validation.email.isNotEmpty' })
  email: string;

  @IsNotEmpty({ message: 'auth.validation.password.isNotEmpty' })
  newPassword: string;
}
