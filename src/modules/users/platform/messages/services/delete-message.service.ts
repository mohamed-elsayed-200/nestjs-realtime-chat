import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  MessageStatus,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class DeleteMessageService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async delete({ dto, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(dto?.space);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = space.type === SpaceTypes.PRIVATE;

    const member = !isPrivate
      ? await this.membersRepository.findOne({
          query: { space: spaceObjectId, user: userObjectId },
        })
      : null;

    if (!isPrivate && !member) {
      throw new BadRequestException('spaces.notMember');
    }

    const canDeleteAny =
      !isPrivate &&
      (member.role === SpaceMemberRole.OWNER ||
        (member.role === SpaceMemberRole.ADMIN &&
          member.permissions?.includes(
            SpaceMemberPermission.DELETE_ANY_MESSAGE,
          )));

    const messages = await this.messagesRepository.findMany({
      query: {
        _id: { $in: dto?.messages },
        space: spaceObjectId,
        ...(!canDeleteAny && { sender: userObjectId }),
      },
    });

    if (messages.length === 0) throw new NotFoundException('messages.notFound');

    if (!canDeleteAny) {
      const allBelongToUser = messages.every(
        (msg) => msg.sender?.toString() === userObjectId.toString(),
      );
      if (!allBelongToUser) {
        throw new BadRequestException('messages.notAllowedToDelete');
      }
    }

    const foundIds = messages.map((m) => m._id.toString());
    const isSenderOfAll = messages.every(
      (msg) => msg.sender?.toString() === userObjectId.toString(),
    );

    const deleteForAll = isPrivate
      ? Boolean(dto?.everybody) && isSenderOfAll
      : canDeleteAny || isSenderOfAll;

    if (isPrivate) {
      let deleteTargetIds: Types.ObjectId[] = [userObjectId];

      if (deleteForAll) {
        const privateMembers = await this.membersRepository.findMany({
          query: { space: spaceObjectId },
        });
        deleteTargetIds = privateMembers.map(
          (m: any) => new Types.ObjectId(String(m.user)),
        );
      }

      await this.messagesRepository.updateMany({
        query: { _id: { $in: foundIds } },
        dto: { $addToSet: { deletedFrom: { $each: deleteTargetIds } } },
      });

      const affectedOthers = await this.membersRepository.findMany({
        query: {
          space: spaceObjectId,
          user: { $in: deleteTargetIds, $ne: userObjectId },
          lastMessage: { $in: foundIds },
        },
      });

      for (const m of affectedOthers) {
        const uid = new Types.ObjectId(String(m.user));
        const lastMsg = await this.messagesRepository.findOne({
          query: { space: spaceObjectId, deletedFrom: { $ne: uid } },
          sort: { createdAt: -1 },
        });
        await this.membersRepository.updateOne({
          query: { space: spaceObjectId, user: uid },
          dto: { lastMessage: lastMsg?._id || null },
        });
      }

      const myLastMessage = await this.messagesRepository.findOne({
        query: { space: spaceObjectId, deletedFrom: { $ne: userObjectId } },
        sort: { createdAt: -1 },
      });

      await this.membersRepository.updateOne({
        query: { space: spaceObjectId, user: userObjectId },
        dto: { lastMessage: myLastMessage?._id || null },
      });

      if (deleteForAll) {
        const unreadDeletedCount = messages.filter(
          (msg) => msg.status === MessageStatus.SENT,
        ).length;

        if (unreadDeletedCount > 0) {
          await this.membersRepository.updateMany({
            query: { space: spaceObjectId, user: { $ne: userObjectId } },
            dto: { $inc: { unreadCount: -unreadDeletedCount } },
          });
        }
      }

      return {
        deletedCount: foundIds.length,
        lastMessage: {
          ...myLastMessage,
          id: myLastMessage?._id,
          _id: undefined,
        },
      };
    }

    await this.messagesRepository.deleteMany({
      query: { _id: { $in: foundIds } },
    });

    let spaceLastMessage: any = null;
    if (space.lastMessage && foundIds.includes(space.lastMessage.toString())) {
      spaceLastMessage = await this.messagesRepository.findOne({
        query: { space: spaceObjectId },
        sort: { createdAt: -1 },
      });

      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { lastMessage: spaceLastMessage?._id || null },
      });
    }

    return {
      deletedCount: foundIds.length,
      lastMessage: spaceLastMessage
        ? { ...spaceLastMessage, id: spaceLastMessage._id, _id: undefined }
        : null,
    };
  }
}
