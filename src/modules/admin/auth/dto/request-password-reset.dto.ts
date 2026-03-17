import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'auth.validation.email.invalid' })
  @IsNotEmpty({ message: 'auth.validation.email.isNotEmpty' })
  email: string;
}
