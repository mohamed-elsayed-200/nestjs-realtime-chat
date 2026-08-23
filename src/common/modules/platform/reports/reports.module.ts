// reports/reports.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ContentReport,
  ContentReportSchema,
} from './schemas/content-report.schema';
import { SystemIssue, SystemIssueSchema } from './schemas/system-issue.schema';
import { ContentReportsRepository } from './repositories/content-reports.repository';
import { SystemIssuesRepository } from './repositories/system-issues.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContentReport.name, schema: ContentReportSchema },
      { name: SystemIssue.name, schema: SystemIssueSchema },
    ]),
  ],
  providers: [ContentReportsRepository, SystemIssuesRepository],
  exports: [ContentReportsRepository, SystemIssuesRepository],
})
export class BaseReportsModule {}
