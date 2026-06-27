import { ArrayMaxSize, IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class InviteContactsDto {
  @IsNotEmpty({ message: 'contacts.validation.isNotEmpty' })
  @IsArray({ message: 'contacts.validation.isArray' })
  @ArrayMaxSize(50, { message: 'contacts.validation.maxSize' })
  @IsMongoId({ each: true, message: 'contacts.validation.isMongoId' })
  contacts: string[];
}
