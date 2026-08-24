import { Injectable } from '@nestjs/common';
import { ContentReportsRepository } from '../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { SystemIssuesRepository } from '../../../../../common/modules/platform/reports/repositories/system-issues.repository';
import { ReportStatus, IssueStatus } from '../../../../../common/types/enums';

export interface PendingAction {
  id: string;
  type: 'report' | 'issue';
  title: string;
  description: string;
  count: number;
}

@Injectable()
export class GetPendingActionsService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async get(): Promise<PendingAction[]> {
    const [pendingReports, openIssues] = await Promise.all([
      this.contentReportsRepository.count({
        query: { status: ReportStatus.PENDING },
      }),
      this.systemIssuesRepository.count({
        query: { status: IssueStatus.OPEN },
      }),
    ]);

    const actions: PendingAction[] = [];

    if (pendingReports > 0) {
      actions.push({
        id: 'pending-reports',
        type: 'report',
        title: 'Pending Reports',
        description: 'Reports awaiting review',
        count: pendingReports,
      });
    }

    if (openIssues > 0) {
      actions.push({
        id: 'open-issues',
        type: 'issue',
        title: 'Open Issues',
        description: 'Issues that need attention',
        count: openIssues,
      });
    }

    return actions;
  }
}
