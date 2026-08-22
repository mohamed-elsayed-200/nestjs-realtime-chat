import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateContactDto {
  @IsString({ message: 'contacts.validation.name.isString' })
  @IsNotEmpty({ message: 'contacts.validation.name.isNotEmpty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'contacts.validation.name.isString' })
  profileColor: string;

  @IsOptional()
  @IsUrl({}, { message: 'contacts.validation.name.isUrl' })
  avatar: string;

  @IsMongoId({ message: 'contacts.validation.userId.isMongoId' })
  @IsNotEmpty({ message: 'contacts.validation.userId.isNotEmpty' })
  userId: string;
}
