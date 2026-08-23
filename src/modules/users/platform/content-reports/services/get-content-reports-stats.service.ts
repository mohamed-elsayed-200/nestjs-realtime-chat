// get-content-reports-stats.service.ts
import { Injectable } from '@nestjs/common';
import { ContentReportsRepository } from '../../../../../common/modules/platform/content-reports/content-reports.repository';
import { ContentReportStatus } from '../../../../../common/types/enums';

@Injectable()
export class GetContentReportsStatsService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  async get() {
    const [pending, underReview, resolved, dismissed] = await Promise.all([
      this.contentReportsRepository.count({
        query: { status: ContentReportStatus.PENDING },
      }),
      this.contentReportsRepository.count({
        query: { status: ContentReportStatus.UNDER_REVIEW },
      }),
      this.contentReportsRepository.count({
        query: { status: ContentReportStatus.RESOLVED },
      }),
      this.contentReportsRepository.count({
        query: { status: ContentReportStatus.DISMISSED },
      }),
    ]);

    return {
      pending,
      underReview,
      resolved,
      dismissed,
      total: pending + underReview + resolved + dismissed,
    };
  }
}
