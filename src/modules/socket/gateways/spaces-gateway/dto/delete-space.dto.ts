import { IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class DeleteSpaceDto {
  @IsBoolean()
  @IsNotEmpty()
  everybody: boolean;

  @IsNotEmpty()
  @IsMongoId()
  spaceId: string;
}
