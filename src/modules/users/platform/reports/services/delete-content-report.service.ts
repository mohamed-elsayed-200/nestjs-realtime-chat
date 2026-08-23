import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { ReportStatus } from '../../../../../common/types/enums';

@Injectable()
export class DeleteContentReportService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async delete({
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

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('reports.cannotDeleteProcessed');
    }

    return this.contentReportsRepository.deleteOne({
      query: { _id: new Types.ObjectId(reportId) },
    });
  }
}
