import { IsString, IsMongoId, IsNotEmpty } from 'class-validator';

export class ToggleReactionCommentDto {
  @IsMongoId()
  @IsNotEmpty()
  comment: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}
