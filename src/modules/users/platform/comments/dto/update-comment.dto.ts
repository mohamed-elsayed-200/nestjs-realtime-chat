import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  content: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
