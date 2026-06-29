import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class ToggleBanMemberDto {
  @IsMongoId()
  @IsNotEmpty()
  member: string;

  @IsMongoId()
  @IsNotEmpty()
  space: string;

  @IsOptional()
  @IsNotEmpty()
  bannedReason?: string;
}
