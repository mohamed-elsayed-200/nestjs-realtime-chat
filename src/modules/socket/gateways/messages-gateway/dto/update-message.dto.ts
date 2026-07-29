import { IsString, IsOptional, IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  message?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  text: string;
}
