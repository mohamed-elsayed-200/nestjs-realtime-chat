import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString({ message: 'contacts.validation.name.isString' })
  @IsNotEmpty({ message: 'contacts.validation.name.isNotEmpty' })
  name: string;

  @IsEmail({}, { message: 'contacts.validation.email.invalid' })
  @IsNotEmpty({ message: 'contacts.validation.email.isNotEmpty' })
  email: string;
}
