import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ToggleMuteMemberDto {
  @IsNotEmpty()
  @IsMongoId()
  member: string;

  @IsNotEmpty()
  @IsMongoId()
  space: string;
}
