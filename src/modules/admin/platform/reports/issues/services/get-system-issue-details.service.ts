import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';

@Injectable()
export class GetSystemIssueDetailsService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async get({ issueId }: { issueId: string }) {
    const result = await this.systemIssuesRepository.findAll({
      query: {
        filter: { _id: new Types.ObjectId(issueId) },
        page: 0,
        pageSize: 1,
      },
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
            $lookup: {
              from: 'users',
              localField: 'assignedTo',
              foreignField: '_id',
              as: 'assignedDoc',
            },
          },
          {
            $unwind: { path: '$assignedDoc', preserveNullAndEmptyArrays: true },
          },
          {
            $addFields: {
              reporterInfo: {
                _id: '$reporterDoc._id',
                name: '$reporterDoc.name',
                avatar: '$reporterDoc.avatar',
                email: '$reporterDoc.email',
              },
              assignedToInfo: {
                $cond: [
                  { $ifNull: ['$assignedDoc', false] },
                  {
                    _id: '$assignedDoc._id',
                    name: '$assignedDoc.name',
                    avatar: '$assignedDoc.avatar',
                  },
                  null,
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              category: 1,
              priority: 1,
              status: 1,
              reporterInfo: 1,
              assignedTo: 1,
              assignedToInfo: 1,
              attachments: 1,
              resolutionNotes: 1,
              deviceInfo: 1,
              appVersion: 1,
              reopenCount: 1,
              createdAt: 1,
              updatedAt: 1,
              resolvedAt: 1,
              closedAt: 1,
            },
          },
        ],
        allowedFilterFields: ['_id'],
      },
    });

    if (!result.items?.length) throw new NotFoundException('issues.notFound');
    return result.items[0];
  }
}
