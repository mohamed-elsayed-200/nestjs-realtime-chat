import { IsMongoId, IsNotEmpty } from 'class-validator';

export class DismissAdminDto {
  @IsNotEmpty()
  @IsMongoId()
  member: string;

  @IsNotEmpty()
  @IsMongoId()
  space: string;
}
