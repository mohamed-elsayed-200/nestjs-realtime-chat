import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreatePrivateSpaceDto {
  @IsNotEmpty({ message: 'categories.validation.memberId.isNotEmpty' })
  @IsMongoId({ message: 'categories.validation.memberId.isMongoId' })
  memberId: string;
}
