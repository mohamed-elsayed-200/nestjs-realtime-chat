import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateChannelSpaceDto {
  @IsNotEmpty({ message: 'categories.validation.memberId.isNotEmpty' })
  @IsArray({ message: 'categories.validation.members.isArray' })
  @IsMongoId({ each: true, message: 'categories.validation.members.isMongoId' })
  members: string[];
}
