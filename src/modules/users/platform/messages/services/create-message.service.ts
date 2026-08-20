import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpaceTypes } from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';

@Injectable()
export class CreateMessageService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async create({ dto, authUser }) {
    const senderObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(dto.space);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('spaces.notFoundOne');
    const authMember = await this.membersRepository.findOne({
      query: { user: senderObjectId, space: spaceObjectId },
    });
    if (!authMember) throw new NotFoundException('members.notFoundOne');

    const message: any = await this.messagesRepository.createOne({
      dto: { ...dto, sender: senderObjectId },
    });
    if (!message) throw new InternalServerErrorException('messages.notCreated');

    const messageObjectId = new Types.ObjectId(message._id.toString());

    await this.membersRepository.updateMany({
      query: {
        space: spaceObjectId,
        user: { $ne: senderObjectId },
      },
      dto: {
        isDeleted: false,
        $inc: { unreadCount: 1 },
      },
    });

    const isPrivate = space.type === SpaceTypes.PRIVATE;
    let parentSpace: { id: string; name: string };
    if (isPrivate) {
      await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { lastMessage: messageObjectId },
      });
    } else {
      const updatedSpace = await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { lastMessage: messageObjectId },
      });
      if (updatedSpace && updatedSpace?.parentSpace) {
        const findParentSpace = await this.spacesRepository.findOne({
          query: { _id: updatedSpace?.parentSpace },
        });
        if (!findParentSpace || findParentSpace?.type !== SpaceTypes.COMMUNITY)
          return;

        parentSpace = {
          id: findParentSpace._id.toString(),
          name: updatedSpace.name,
        };
        const msg: any = await this.messagesRepository.createOne({
          dto: {
            ...dto,
            space: findParentSpace?._id,
            text: `${updatedSpace?.name}: ${dto.text}`,
            sender: senderObjectId,
          },
        });

        if (!msg) throw new InternalServerErrorException('messages.notCreated');
        const msgObjectId = new Types.ObjectId(msg._id.toString());

        await this.spacesRepository.updateOne({
          query: { _id: findParentSpace?._id, type: SpaceTypes.COMMUNITY },
          dto: { lastMessage: msgObjectId },
        });
        await this.membersRepository.updateMany({
          query: {
            space: findParentSpace?._id,
            user: { $ne: senderObjectId },
          },
          dto: {
            isDeleted: false,
            $inc: { unreadCount: 1 },
          },
        });
      }
    }

    return {
      ...message.toObject(),
      id: message?._id?.toString(),
      _id: undefined,
      parentSpace,
      spaceType: space?.type,
      replyTo: message?.replyTo?._id
        ? {
            ...message?.toObject()?.replyTo,
            id: message?.replyTo?._id,
            _id: undefined,
            sender: message?.replyTo?.sender
              ? {
                  ...message?.replyTo?.sender.toObject(),
                  id: message?.replyTo?.sender?._id,
                  _id: undefined,
                }
              : message?.replyTo?.sender,
          }
        : undefined,
      sender: {
        id: authUser?._id,
        adminTag: authMember?.adminTag,
        adminTagColor: authMember?.adminTagColor,
        name: authUser?.name,
        username: authUser?.username,
        avatar: authUser?.avatar,
        profileColor: authUser?.profileColor,
      },
    };
  }
}
