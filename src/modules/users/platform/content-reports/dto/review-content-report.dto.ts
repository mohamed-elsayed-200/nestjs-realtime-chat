// dto/review-content-report.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentReportStatus } from '../../../../../common/types/enums';

export class ReviewContentReportDto {
  @IsEnum(ContentReportStatus)
  status: ContentReportStatus;

  @IsOptional()
  @IsString()
  reviewNote?: string;

  @IsOptional()
  @IsString()
  actionTaken?: string;
}
