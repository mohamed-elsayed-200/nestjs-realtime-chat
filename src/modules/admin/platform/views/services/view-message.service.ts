import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ViewsRepository } from '../../../../../common/modules/platform/views/views.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { ViewTargetType } from '../../../../../common/types/enums';

@Injectable()
export class ViewMessageService {
  constructor(
    private readonly viewsRepository: ViewsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async view({ message, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const messageObjectId = new Types.ObjectId(message);

    const findMessage = await this.messagesRepository.findOne({
      query: { _id: messageObjectId },
    });

    if (!findMessage) throw new NotFoundException('messages.notFoundOne');

    const isViewed = await this.viewsRepository.findOne({
      query: {
        target: messageObjectId,
        targetType: ViewTargetType.MESSAGE,
        user: userObjectId,
      },
    });

    if (isViewed)
      return { ...findMessage, id: findMessage._id, _id: undefined };

    const newView = await this.viewsRepository.createOne({
      dto: {
        target: messageObjectId,
        targetType: ViewTargetType.MESSAGE,
        user: userObjectId,
      },
    });
    if (!newView) return;

    const updated = await this.messagesRepository.updateOne({
      query: { _id: messageObjectId },
      dto: { $inc: { viewCount: 1 } },
    });

    if (!updated) throw new NotFoundException('messages.notUpdated');

    return {
      ...updated.toObject(),
      id: updated._id.toString(),
      _id: undefined,
    };
  }
}
