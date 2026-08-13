import { IsMongoId, IsNotEmpty } from 'class-validator';

export class DismissAdminDto {
  @IsMongoId()
  @IsNotEmpty()
  member: string;

  @IsMongoId()
  @IsNotEmpty()
  space: string;
}
