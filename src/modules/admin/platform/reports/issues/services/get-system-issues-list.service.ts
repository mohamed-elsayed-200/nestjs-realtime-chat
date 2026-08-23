import { Injectable } from '@nestjs/common';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';
import {
  GetSystemIssuesQueryDto,
  SystemIssueTab,
} from '../dto/get-system-issues-query.dto';
import { IssueStatus } from '../../../../../../common/types/enums';

@Injectable()
export class GetSystemIssuesListService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async get({ query }: { query: GetSystemIssuesQueryDto }) {
    const { tab, category, priority, status, ...restQuery } = query;
    const existingFilter =
      query.filter && !Array.isArray(query.filter) ? query.filter : {};

    const tabStatus = this.mapTabToStatus(tab);
    const finalStatus = status || tabStatus;

    const extraFilter: any = {};
    if (finalStatus) extraFilter.status = finalStatus;
    if (category) extraFilter.category = category;
    if (priority) extraFilter.priority = priority;

    const pipelines: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'reportedBy',
          foreignField: '_id',
          as: 'reporterDoc',
        },
      },
      { $unwind: { path: '$reporterDoc', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          reporterName: { $ifNull: ['$reporterDoc.name', 'Unknown'] },
          reporterAvatar: '$reporterDoc.avatar',
        },
      },
    ];

    const sanitizedQuery = {
      ...restQuery,
      filter: {
        ...existingFilter,
        ...extraFilter,
      },
    };

    return this.systemIssuesRepository.findAll({
      query: sanitizedQuery,
      options: {
        pipelines,
        allowedFilterFields: ['status', 'category', 'priority', 'reportedBy'],
        allowedSearchFields: ['title', 'description'],
        sort: { createdAt: -1 },
        includeFields: [
          '_id',
          'title',
          'category',
          'priority',
          'status',
          'reporterName',
          'reporterAvatar',
          'assignedTo',
          'createdAt',
          'updatedAt',
        ],
      },
    });
  }

  private mapTabToStatus(tab?: SystemIssueTab): IssueStatus | undefined {
    switch (tab) {
      case SystemIssueTab.OPEN:
        return IssueStatus.OPEN;
      case SystemIssueTab.IN_PROGRESS:
        return IssueStatus.IN_PROGRESS;
      case SystemIssueTab.RESOLVED:
        return IssueStatus.RESOLVED;
      default:
        return undefined;
    }
  }
}
