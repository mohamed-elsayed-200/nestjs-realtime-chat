import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString({ message: 'contacts.validation.name.isString' })
  @IsNotEmpty({ message: 'contacts.validation.name.isNotEmpty' })
  name: string;

  @IsMongoId({ message: 'contacts.validation.userId.isMongoId' })
  @IsNotEmpty({ message: 'contacts.validation.userId.isNotEmpty' })
  userId: string;
}
