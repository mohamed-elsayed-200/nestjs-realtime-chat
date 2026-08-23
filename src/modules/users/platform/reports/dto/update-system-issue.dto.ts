import { IsString, IsOptional } from 'class-validator';

export class UpdateSystemIssueDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
