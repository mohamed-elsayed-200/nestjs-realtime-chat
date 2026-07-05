import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsMongoId()
  @IsNotEmpty()
  message: string;

  @IsMongoId()
  @IsNotEmpty()
  space: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;
}
