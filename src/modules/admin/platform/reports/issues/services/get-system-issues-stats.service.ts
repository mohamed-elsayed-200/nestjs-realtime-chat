// admins/reports/issues/services/get-system-issues-stats.service.ts
import { Injectable } from '@nestjs/common';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';
import { IssueStatus } from '../../../../../../common/types/enums';

@Injectable()
export class GetSystemIssuesStatsService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async get() {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.systemIssuesRepository.count({ query: {} }),
      this.systemIssuesRepository.count({
        query: { status: IssueStatus.OPEN },
      }),
      this.systemIssuesRepository.count({
        query: { status: IssueStatus.IN_PROGRESS },
      }),
      this.systemIssuesRepository.count({
        query: { status: IssueStatus.RESOLVED },
      }),
      this.systemIssuesRepository.count({
        query: { status: IssueStatus.CLOSED },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
    };
  }
}
