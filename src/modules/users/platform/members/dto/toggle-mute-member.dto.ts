import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ToggleRestrictedMemberDto {
  @IsNotEmpty()
  @IsMongoId()
  member: string;

  @IsNotEmpty()
  @IsMongoId()
  space: string;
}
