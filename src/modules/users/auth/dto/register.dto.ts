import { IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'auth.validation.email.invalid' })
  @IsNotEmpty({ message: 'auth.validation.email.isNotEmpty' })
  email: string;

  @IsNotEmpty({ message: 'auth.validation.password.isNotEmpty' })
  password: string;

  @IsNotEmpty({ message: 'auth.validation.name.isNotEmpty' })
  name: string;
}
