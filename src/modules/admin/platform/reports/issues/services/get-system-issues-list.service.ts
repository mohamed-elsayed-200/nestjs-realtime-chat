import { Injectable } from '@nestjs/common';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';

@Injectable()
export class GetSystemIssuesListService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async get({ query }) {
    return this.systemIssuesRepository.findAll({
      query,
      options: {
        pipelines: [
          {
            $lookup: {
              from: 'users',
              localField: 'reportedBy',
              foreignField: '_id',
              as: 'reporterDoc',
            },
          },
          {
            $unwind: { path: '$reporterDoc', preserveNullAndEmptyArrays: true },
          },
          {
            $addFields: {
              reporterName: { $ifNull: ['$reporterDoc.name', 'Unknown'] },
              reporterAvatar: '$reporterDoc.avatar',
            },
          },
        ],
        allowedFilterFields: ['status', 'category', 'priority', 'reportedBy'],
        allowedSearchFields: ['title', 'description'],
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
}
