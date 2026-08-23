import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../../common/modules/platform/reports/repositories/content-reports.repository';

@Injectable()
export class GetContentReportDetailsService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async get({ reportId }: { reportId: string }) {
    const result = await this.contentReportsRepository.findAll({
      query: {
        filter: { _id: new Types.ObjectId(reportId) },
        page: 0,
        pageSize: 1,
      },
      options: {
        pipelines: [
          {
            $lookup: {
              from: 'users',
              localField: 'reporter',
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
              localField: 'targetId',
              foreignField: '_id',
              as: 'targetUser',
            },
          },
          {
            $lookup: {
              from: 'messages',
              localField: 'targetId',
              foreignField: '_id',
              as: 'targetMessage',
            },
          },
          {
            $lookup: {
              from: 'spaces',
              localField: 'targetId',
              foreignField: '_id',
              as: 'targetSpace',
            },
          },
          {
            $addFields: {
              reporterInfo: {
                _id: '$reporterDoc._id',
                name: '$reporterDoc.name',
                avatar: '$reporterDoc.avatar',
                email: '$reporterDoc.email',
              },
              targetInfo: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$targetType', 'user'] },
                      then: { $arrayElemAt: ['$targetUser', 0] },
                    },
                    {
                      case: { $eq: ['$targetType', 'message'] },
                      then: { $arrayElemAt: ['$targetMessage', 0] },
                    },
                    {
                      case: { $eq: ['$targetType', 'group'] },
                      then: { $arrayElemAt: ['$targetSpace', 0] },
                    },
                    {
                      case: { $eq: ['$targetType', 'channel'] },
                      then: { $arrayElemAt: ['$targetSpace', 0] },
                    },
                    {
                      case: { $eq: ['$targetType', 'community'] },
                      then: { $arrayElemAt: ['$targetSpace', 0] },
                    },
                  ],
                  default: null,
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              reporter: 1,
              reporterInfo: 1,
              targetId: 1,
              targetType: 1,
              targetInfo: 1,
              reason: 1,
              description: 1,
              evidenceFiles: 1,
              status: 1,
              resolvedBy: 1,
              resolutionNotes: 1,
              resolvedAt: 1,
              isActionTaken: 1,
              actionTaken: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        allowedFilterFields: ['_id'],
      },
    });

    if (!result.items?.length) throw new NotFoundException('reports.notFound');
    return result.items[0];
  }
}
