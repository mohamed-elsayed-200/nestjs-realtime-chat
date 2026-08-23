// users/reports/services/get-my-report-details.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../common/modules/platform/reports/repositories/content-reports.repository';

@Injectable()
export class GetMyReportDetailsService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async get({ reportId, authUser }) {
    const report = await this.contentReportsRepository.findOne({
      query: { _id: new Types.ObjectId(reportId) },
    });

    if (!report) throw new NotFoundException('reports.notFound');

    if (report.reporter?.toString() !== authUser._id.toString()) {
      throw new ForbiddenException('reports.forbidden');
    }

    return report;
  }
}
