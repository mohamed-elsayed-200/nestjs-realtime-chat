import { Injectable } from '@nestjs/common';
import { ContentReportsRepository } from '../../../../../common/modules/platform/content-reports/content-reports.repository';

@Injectable()
export class GetContentReportsService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  async get({ query }) {
    return this.contentReportsRepository.findAll({
      query,
      options: {
        pipelines: [
          {
            $lookup: {
              from: 'users',
              localField: 'reportedBy',
              foreignField: '_id',
              as: 'reportedByDoc',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'reportedUser',
              foreignField: '_id',
              as: 'reportedUserDoc',
            },
          },
          {
            $addFields: {
              reportedBy: {
                $let: {
                  vars: { u: { $arrayElemAt: ['$reportedByDoc', 0] } },
                  in: {
                    _id: '$$u._id',
                    name: '$$u.name',
                    avatar: '$$u.avatar',
                    username: '$$u.username',
                  },
                },
              },
              reportedUser: {
                $let: {
                  vars: { u: { $arrayElemAt: ['$reportedUserDoc', 0] } },
                  in: {
                    _id: '$$u._id',
                    name: '$$u.name',
                    avatar: '$$u.avatar',
                    username: '$$u.username',
                  },
                },
              },
            },
          },
          { $project: { reportedByDoc: 0, reportedUserDoc: 0 } },
        ],
        sort: { createdAt: -1 },
        allowedFilterFields: ['status', 'reason', 'targetType'],
      },
    });
  }
}
