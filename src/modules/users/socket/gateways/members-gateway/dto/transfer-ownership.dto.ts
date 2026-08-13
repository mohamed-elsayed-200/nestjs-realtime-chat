import { IsMongoId, IsNotEmpty } from 'class-validator';

export class TransferOwnershipDto {
  @IsNotEmpty()
  @IsMongoId()
  member: string;

  @IsNotEmpty()
  @IsMongoId()
  space: string;
}
