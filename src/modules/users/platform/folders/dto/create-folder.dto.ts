import { IsString, IsArray, IsOptional, IsNumber } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsArray()
  @IsOptional()
  spaceIds?: string[];

  @IsNumber()
  @IsOptional()
  order?: number;
}
