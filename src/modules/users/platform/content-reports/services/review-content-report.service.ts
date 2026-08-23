// review-content-report.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../common/modules/platform/content-reports/content-reports.repository';
import { ReviewContentReportDto } from '../dto/review-content-report.dto';

@Injectable()
export class ReviewContentReportService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  async review({
    reportId,
    dto,
    authUser,
  }: {
    reportId: string;
    dto: ReviewContentReportDto;
    authUser: any;
  }) {
    const report = await this.contentReportsRepository.updateOne({
      query: { _id: new Types.ObjectId(reportId) },
      dto: {
        ...dto,
        reviewedBy: authUser._id,
        reviewedAt: new Date(),
      },
    });

    if (!report) throw new NotFoundException('contentReports.notFound');

    return { report };
  }
}
