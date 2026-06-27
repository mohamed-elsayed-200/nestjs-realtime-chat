import { IsBoolean, IsNotEmpty } from 'class-validator';

export class DeleteSpaceDto {
  @IsBoolean()
  @IsNotEmpty()
  everyone: boolean;
}
