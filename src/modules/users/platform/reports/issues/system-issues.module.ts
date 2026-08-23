import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../../common/modules/auth/auth.module';
import { BaseReportsModule } from '../../../../../common/modules/platform/reports/reports.module';
import { SystemIssuesController } from './system-issues.controller';
import { CreateSystemIssueService } from './services/create-system-issue.service';
import { GetMySystemIssuesService } from './services/get-my-system-issues.service';
import { GetMySystemIssueDetailsService } from './services/get-my-system-issue-details.service';
import { UpdateSystemIssueService } from './services/update-system-issue.service';

@Module({
  imports: [BaseAuthModule, BaseReportsModule],
  controllers: [SystemIssuesController],
  providers: [
    CreateSystemIssueService,
    GetMySystemIssuesService,
    GetMySystemIssueDetailsService,
    UpdateSystemIssueService,
  ],
})
export class SystemIssuesModule {}
