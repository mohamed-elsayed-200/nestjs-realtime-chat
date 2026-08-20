import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AddViewDto {
  @IsMongoId()
  @IsNotEmpty()
  target: string;
}
