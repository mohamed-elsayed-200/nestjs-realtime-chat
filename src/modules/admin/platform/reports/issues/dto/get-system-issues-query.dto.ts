import { IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from '../../../../../../common/modules/dto/query.dto';
import {
  IssueStatus,
  IssueCategory,
  IssuePriority,
} from '../../../../../../common/types/enums';

export enum SystemIssueTab {
  ALL = 'all',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

export class GetSystemIssuesQueryDto extends QueryDto {
  @IsOptional()
  @IsEnum(SystemIssueTab)
  tab?: SystemIssueTab;

  @IsOptional()
  @IsEnum(IssueCategory)
  category?: IssueCategory;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;
}
