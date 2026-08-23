import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportReason } from '../../../../../common/types/enums';

export class UpdateContentReportDto {
  @IsEnum(ReportReason)
  @IsOptional()
  reason?: ReportReason;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString({ each: true })
  @IsOptional()
  evidenceFiles?: string[];
}
