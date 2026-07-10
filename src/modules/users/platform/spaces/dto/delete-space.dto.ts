import { IsBoolean, IsNotEmpty } from 'class-validator';

export class DeleteSpaceDto {
  @IsBoolean()
  @IsNotEmpty()
  everybody: boolean;
}
