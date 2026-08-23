import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../../common/modules/auth/auth.module';
import { BaseReportsModule } from '../../../../../common/modules/platform/reports/reports.module';
import { UpdateContentReportService } from './services/update-content-report.service';
import { DeleteContentReportService } from './services/delete-content-report.service';
import { CancelContentReportService } from './services/cancel-content-report.service';
import { CreateContentReportService } from './services/create-content-report.service';
import { GetMyReportsService } from './services/get-my-reports.service';
import { GetMyReportDetailsService } from './services/get-my-report-details.service';
import { ContentReportsController } from './content-reports.controller';

@Module({
  imports: [BaseAuthModule, BaseReportsModule],
  controllers: [ContentReportsController],
  providers: [
    CreateContentReportService,
    GetMyReportsService,
    GetMyReportDetailsService,
    UpdateContentReportService,
    DeleteContentReportService,
    CancelContentReportService,
  ],
})
export class ContentReportsModule {}
