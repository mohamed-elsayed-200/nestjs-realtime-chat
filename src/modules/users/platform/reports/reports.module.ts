import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseReportsModule } from '../../../../common/modules/platform/reports/reports.module';
import { ReportsController } from './reports.controller';
import { CreateContentReportService } from './services/create-content-report.service';
import { GetMyReportsService } from './services/get-my-reports.service';
import { GetMyReportDetailsService } from './services/get-my-report-details.service';

@Module({
  imports: [BaseAuthModule, BaseReportsModule],
  controllers: [ReportsController],
  providers: [
    CreateContentReportService,
    GetMyReportsService,
    GetMyReportDetailsService,
  ],
})
export class ReportsModule {}
