import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentReportsRepository } from '../../../../../common/modules/platform/content-reports/content-reports.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import {
  ContentReportStatus,
  ContentReportTargetType,
} from '../../../../../common/types/enums';

@Injectable()
export class CreateContentReportService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  async create({ dto, authUser }) {
    let contentSnapshot: string | undefined;
    let reportedUser: string | undefined;

    // Snapshot the message content/sender at report time so moderators can
    // still see what was reported even if it's edited or deleted afterwards
    if (dto.targetType === ContentReportTargetType.MESSAGE) {
      const message = await this.messagesRepository.findOne({
        query: { _id: dto.targetId },
      });
      if (!message) throw new NotFoundException('messages.notFound');

      contentSnapshot = message.text ?? message.content;
      reportedUser = message.sender?.toString();
    }

    const report = await this.contentReportsRepository.createOne({
      dto: {
        ...dto,
        reportedBy: authUser._id,
        reportedUser,
        contentSnapshot,
        status: ContentReportStatus.PENDING,
      },
    });

    return { report };
  }
}
