import { IsString, IsMongoId, IsNotEmpty } from 'class-validator';

export class ToggleReactionDto {
  @IsMongoId()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}
