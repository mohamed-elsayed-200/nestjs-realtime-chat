import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryGetSpacesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  spaceType?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    if (typeof value !== 'string') return value;

    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('Invalid filter JSON:', value);
      return undefined;
    }
  })
  filter?: Record<string, any> | any[];

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value); // Parse JSON string from query
    } catch (error) {
      console.warn('Invalid sort JSON:', value);
      return undefined;
    }
  })
  sort?: Record<string, 1 | -1>;
}
