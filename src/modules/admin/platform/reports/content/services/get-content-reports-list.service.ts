import { Injectable } from '@nestjs/common';
import { ContentReportsRepository } from '../../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import {
  GetContentReportsQueryDto,
  ContentReportTab,
} from '../dto/get-content-reports-query.dto';
import { ReportType } from '../../../../../../common/types/enums';

@Injectable()
export class GetContentReportsListService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async get({ query }: { query: GetContentReportsQueryDto }) {
    const { tab, status, ...restQuery } = query;
    const existingFilter =
      query.filter && !Array.isArray(query.filter) ? query.filter : {};

    const typeFilter = this.mapTabToType(tab);
    const statusFilter = status ? { status } : {};

    const pipelines: any[] = [
      // Populate reporter
      {
        $lookup: {
          from: 'users',
          localField: 'reporter',
          foreignField: '_id',
          as: 'reporterDoc',
        },
      },
      { $unwind: { path: '$reporterDoc', preserveNullAndEmptyArrays: true } },

      // Populate target from users
      {
        $lookup: {
          from: 'users',
          localField: 'targetId',
          foreignField: '_id',
          as: 'targetUser',
        },
      },
      // Populate target from messages
      {
        $lookup: {
          from: 'messages',
          localField: 'targetId',
          foreignField: '_id',
          as: 'targetMessage',
        },
      },
      // Populate target from spaces
      {
        $lookup: {
          from: 'spaces',
          localField: 'targetId',
          foreignField: '_id',
          as: 'targetSpace',
        },
      },

      // Build target display fields
      {
        $addFields: {
          reporterName: { $ifNull: ['$reporterDoc.name', 'Unknown'] },
          reporterAvatar: '$reporterDoc.avatar',
          targetName: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$targetType', ReportType.USER] },
                  then: { $arrayElemAt: ['$targetUser.name', 0] },
                },
                {
                  case: { $eq: ['$targetType', ReportType.MESSAGE] },
                  then: {
                    $concat: [
                      'Message: ',
                      {
                        $substr: [
                          {
                            $ifNull: [
                              { $arrayElemAt: ['$targetMessage.text', 0] },
                              '',
                            ],
                          },
                          0,
                          30,
                        ],
                      },
                    ],
                  },
                },
                {
                  case: { $eq: ['$targetType', ReportType.GROUP] },
                  then: { $arrayElemAt: ['$targetSpace.name', 0] },
                },
                {
                  case: { $eq: ['$targetType', ReportType.CHANNEL] },
                  then: { $arrayElemAt: ['$targetSpace.name', 0] },
                },
                {
                  case: { $eq: ['$targetType', ReportType.COMMUNITY] },
                  then: { $arrayElemAt: ['$targetSpace.name', 0] },
                },
              ],
              default: 'Unknown',
            },
          },
          targetAvatar: {
            $cond: [
              { $eq: ['$targetType', ReportType.USER] },
              { $arrayElemAt: ['$targetUser.avatar', 0] },
              { $arrayElemAt: ['$targetSpace.avatar', 0] },
            ],
          },
        },
      },
    ];

    const sanitizedQuery = {
      ...restQuery,
      filter: {
        ...existingFilter,
        ...typeFilter,
        ...statusFilter,
      },
    };

    return this.contentReportsRepository.findAll({
      query: sanitizedQuery,
      options: {
        pipelines,
        allowedFilterFields: ['status', 'reason', 'targetType', 'reporter'],
        allowedSearchFields: ['description', 'reporterDoc.name', 'targetName'],
        sort: { createdAt: -1 },
        includeFields: [
          '_id',
          'reporterName',
          'reporterAvatar',
          'targetName',
          'targetAvatar',
          'targetType',
          'reason',
          'status',
          'description',
          'createdAt',
          'updatedAt',
        ],
      },
    });
  }

  private mapTabToType(
    tab?: ContentReportTab,
  ): Record<string, any> | undefined {
    if (!tab || tab === ContentReportTab.ALL) return undefined;
    const map: Record<string, ReportType> = {
      [ContentReportTab.USER]: ReportType.USER,
      [ContentReportTab.MESSAGE]: ReportType.MESSAGE,
      [ContentReportTab.GROUP]: ReportType.GROUP,
      [ContentReportTab.CHANNEL]: ReportType.CHANNEL,
      [ContentReportTab.COMMUNITY]: ReportType.COMMUNITY,
    };
    return { targetType: map[tab] };
  }
}
