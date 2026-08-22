import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AcceptRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  space: string;

  @IsNotEmpty()
  @IsMongoId()
  request: string;
}
