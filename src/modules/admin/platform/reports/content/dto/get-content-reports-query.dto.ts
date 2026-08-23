// admins/reports/content/dto/get-content-reports-query.dto.ts
import { IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from '../../../../../../common/modules/dto/query.dto';
import { ReportStatus } from '../../../../../../common/types/enums';

export enum ContentReportTab {
  ALL = 'all',
  USER = 'user',
  MESSAGE = 'message',
  GROUP = 'group',
  CHANNEL = 'channel',
  COMMUNITY = 'community',
}

export class GetContentReportsQueryDto extends QueryDto {
  @IsOptional()
  @IsEnum(ContentReportTab)
  tab?: ContentReportTab;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
