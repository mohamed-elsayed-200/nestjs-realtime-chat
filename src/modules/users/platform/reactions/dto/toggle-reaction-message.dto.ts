import { IsString, IsMongoId, IsNotEmpty } from 'class-validator';

export class ToggleReactionMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}
