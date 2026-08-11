import { IsString, IsMongoId, IsNotEmpty } from 'class-validator';

export class ReactionMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  message: string;

  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;

  @IsString()
  @IsNotEmpty()
  callId: string;
}
