import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  IssueCategory,
  IssuePriority,
} from '../../../../../../common/types/enums';

export class CreateSystemIssueDto {
  @IsString()
  title: string;

  @IsEnum(IssueCategory)
  category: IssueCategory;

  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
