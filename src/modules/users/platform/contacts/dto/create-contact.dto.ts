import { IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString({ message: 'contacts.validation.name.isString' })
  @IsNotEmpty({ message: 'contacts.validation.name.isNotEmpty' })
  name: string;

  @IsString({ message: 'contacts.validation.username.isString' })
  @IsNotEmpty({ message: 'contacts.validation.email.isNotEmpty' })
  username: string;
}
