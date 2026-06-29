import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ToggleMuteDto {
  @IsNotEmpty()
  @IsMongoId()
  member: string;

  @IsNotEmpty()
  @IsMongoId()
  space: string;
}
