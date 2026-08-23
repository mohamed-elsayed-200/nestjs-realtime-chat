import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../../common/modules/auth/auth.module';
import { BaseReportsModule } from '../../../../../common/modules/platform/reports/reports.module';
import { ContentReportsController } from './content-reports.controller';
import { GetContentReportsStatsService } from './services/get-content-reports-stats.service';
import { GetContentReportsListService } from './services/get-content-reports-list.service';
import { GetContentReportDetailsService } from './services/get-content-report-details.service';
import { UpdateContentReportStatusService } from './services/update-content-report-status.service';

@Module({
  imports: [BaseAuthModule, BaseReportsModule],
  controllers: [ContentReportsController],
  providers: [
    GetContentReportsStatsService,
    GetContentReportsListService,
    GetContentReportDetailsService,
    UpdateContentReportStatusService,
  ],
})
export class ContentReportsModule {}
