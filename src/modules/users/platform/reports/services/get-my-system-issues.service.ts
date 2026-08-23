import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { SystemIssuesRepository } from '../../../../../common/modules/platform/reports/repositories/system-issues.repository';
import { QueryDto } from '../../../../../common/modules/dto/query.dto';

@Injectable()
export class GetMySystemIssuesService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async get({ query, authUser }: { query: QueryDto; authUser: any }) {
    const existingFilter =
      query.filter && !Array.isArray(query.filter) ? query.filter : {};

    const sanitizedQuery: QueryDto = {
      ...query,
      filter: {
        ...existingFilter,
        reportedBy: new Types.ObjectId(authUser._id),
      },
    };

    return this.systemIssuesRepository.findAll({
      query: sanitizedQuery,
      options: {
        allowedFilterFields: ['status', 'category', 'priority', 'reportedBy'],
        allowedSearchFields: ['title', 'description'],
        sort: { createdAt: -1 },
      },
    });
  }
}
