import { ArrayMaxSize, IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class InviteMembersToGlobalDto {
  @IsNotEmpty({ message: 'members.validation.isNotEmpty' })
  @IsArray({ message: 'members.validation.isArray' })
  @ArrayMaxSize(50, { message: 'members.validation.maxSize' })
  @IsMongoId({ each: true, message: 'members.validation.isMongoId' })
  members: string[];
}
