import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { QueryDto } from '../../../../../../common/modules/dto/query.dto';

@Injectable()
export class GetMyReportsService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async get({ query, authUser }) {
    const existingFilter =
      query.filter && !Array.isArray(query.filter) ? query.filter : {};

    const sanitizedQuery: QueryDto = {
      ...query,
      filter: {
        ...existingFilter,
        reporter: new Types.ObjectId(authUser._id),
      },
    };

    return this.contentReportsRepository.findAll({
      query: sanitizedQuery,
      options: {
        allowedFilterFields: ['status', 'reason', 'targetType', 'reporter'],
        allowedSearchFields: ['description'],
        sort: { createdAt: -1 },
      },
    });
  }
}
