import { IsMongoId, IsOptional, IsBoolean } from 'class-validator';

export class ClearHistoryDto {
  @IsMongoId()
  space: string;

  @IsOptional()
  @IsBoolean()
  everybody?: boolean;
}
