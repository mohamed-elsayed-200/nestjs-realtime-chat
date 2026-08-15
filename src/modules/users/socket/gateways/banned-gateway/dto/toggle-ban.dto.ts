import { IsMongoId } from 'class-validator';

export class ToggleBanDto {
  @IsMongoId()
  target: string;
}
