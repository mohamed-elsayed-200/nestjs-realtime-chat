import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CommentType } from '../../../../../common/types/enums';

export class CreateCommentDto {
  @IsMongoId()
  @IsNotEmpty()
  message: string;

  @IsEnum(CommentType)
  @IsNotEmpty()
  commentType: CommentType;

  @IsString()
  @IsOptional()
  content: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;

  @IsOptional()
  @IsString()
  stickerPack?: string;

  @IsOptional()
  @IsString()
  stickerId?: string;

  @IsOptional()
  @IsString()
  gifId?: string;

  @IsOptional()
  @IsString()
  gifPack?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}
