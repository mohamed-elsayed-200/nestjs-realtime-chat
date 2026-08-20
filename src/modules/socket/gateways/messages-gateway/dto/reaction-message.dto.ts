import { IsString, IsMongoId, IsNotEmpty } from 'class-validator';

export class ReactionMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;

  @IsString()
  @IsNotEmpty()
  space: string;
}
