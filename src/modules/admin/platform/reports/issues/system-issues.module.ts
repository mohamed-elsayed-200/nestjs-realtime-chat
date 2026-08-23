import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../../common/modules/auth/auth.module';
import { BaseReportsModule } from '../../../../../common/modules/platform/reports/reports.module';
import { SystemIssuesController } from './system-issues.controller';
import { GetSystemIssuesStatsService } from './services/get-system-issues-stats.service';
import { GetSystemIssuesListService } from './services/get-system-issues-list.service';
import { GetSystemIssueDetailsService } from './services/get-system-issue-details.service';
import { UpdateSystemIssueStatusService } from './services/update-system-issue-status.service';
import { AssignSystemIssueService } from './services/assign-system-issue.service';

@Module({
  imports: [BaseAuthModule, BaseReportsModule],
  controllers: [SystemIssuesController],
  providers: [
    GetSystemIssuesStatsService,
    GetSystemIssuesListService,
    GetSystemIssueDetailsService,
    UpdateSystemIssueStatusService,
    AssignSystemIssueService,
  ],
})
export class SystemIssuesModule {}
