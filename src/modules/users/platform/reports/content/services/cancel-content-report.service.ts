import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { ReportStatus } from '../../../../../../common/types/enums';

@Injectable()
export class CancelContentReportService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async cancel({
    reportId,
    authUser,
  }: {
    reportId: string;
    authUser: any;
  }) {
    const report = await this.contentReportsRepository.findOne({
      query: { _id: new Types.ObjectId(reportId) },
    });

    if (!report) throw new NotFoundException('reports.notFound');

    if (report.reporter?.toString() !== authUser._id.toString()) {
      throw new ForbiddenException('reports.forbidden');
    }

    if (
      report.status !== ReportStatus.PENDING &&
      report.status !== ReportStatus.REVIEWING
    ) {
      throw new BadRequestException('reports.alreadyResolved');
    }

    const updated = await this.contentReportsRepository.updateOne({
      query: { _id: new Types.ObjectId(reportId) },
      dto: { status: ReportStatus.DISMISSED },
    });

    if (!updated) throw new NotFoundException('reports.notFound');
    return updated;
  }
}
