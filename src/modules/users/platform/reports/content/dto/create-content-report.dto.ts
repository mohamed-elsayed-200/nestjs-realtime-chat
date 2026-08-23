import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ReportType, ReportReason } from '../../../../../../common/types/enums';

export class CreateContentReportDto {
  @IsEnum(ReportType)
  targetType: ReportType;

  @IsMongoId()
  targetId: string;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString({ each: true })
  @IsOptional()
  evidenceFiles?: string[];
}
