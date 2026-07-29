import { IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class TypingDto {
  @IsNotEmpty()
  @IsMongoId()
  space: string;

  @IsNotEmpty()
  @IsBoolean()
  isTyping: boolean;
}
