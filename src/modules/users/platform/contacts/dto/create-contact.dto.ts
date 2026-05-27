import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class CreateUserDto {
  @IsString({ message: 'user.validation.name.isString' })
  @IsNotEmpty({ message: 'user.validation.name.isNotEmpty' })
  name: string;

  @IsEmail({}, { message: 'user.validation.email.invalid' })
  @IsNotEmpty({ message: 'user.validation.email.isNotEmpty' })
  email: string;
}
