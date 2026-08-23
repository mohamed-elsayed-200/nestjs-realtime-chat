import { Injectable } from '@nestjs/common';
import { ContentReportsRepository } from '../../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { ReportStatus } from '../../../../../../common/types/enums';

@Injectable()
export class GetContentReportsStatsService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async get() {
    const [total, pending, reviewing, resolved, dismissed] = await Promise.all([
      this.contentReportsRepository.count({ query: {} }),
      this.contentReportsRepository.count({
        query: { status: ReportStatus.PENDING },
      }),
      this.contentReportsRepository.count({
        query: { status: ReportStatus.REVIEWING },
      }),
      this.contentReportsRepository.count({
        query: { status: ReportStatus.RESOLVED },
      }),
      this.contentReportsRepository.count({
        query: { status: ReportStatus.DISMISSED },
      }),
    ]);

    return {
      total,
      pending,
      reviewing,
      resolved,
      dismissed,
    };
  }
}
