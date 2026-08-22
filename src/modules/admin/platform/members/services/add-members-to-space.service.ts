import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpaceMemberRole } from '../../../../../common/types/enums';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';

@Injectable()
export class AddMembersToSpaceService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}

  public async add({ space, dto, authUser }) {
    const { members: memberIds } = dto;
    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);

    const member = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!member) throw new NotFoundException('members.notFound');
    if (member.role !== SpaceMemberRole.OWNER)
      throw new BadRequestException('spaces.cantAddMembers');

    const mappedIds: string[] = memberIds.map((id: any) => String(id));
    const uniqueIds: string[] = [...new Set<string>(mappedIds)];
    const validUsers = await this.usersRepository.findMany({
      query: {
        _id: { $in: uniqueIds.map((id: string) => new Types.ObjectId(id)) },
      },
      select: '_id',
    });
    if (validUsers.length === 0) throw new NotFoundException('users.notFound');

    const userIds: string[] = validUsers.map((u: any) => u._id.toString());

    // Fetch isBanned along with isDeleted so we can filter out banned users
    const existing = await this.membersRepository.findMany({
      query: {
        space: spaceObjectId,
        user: { $in: userIds.map((id: string) => new Types.ObjectId(id)) },
      },
      select: 'user isDeleted isBanned',
    });

    const existingMap = new Map(
      existing.map((m) => [
        m.user.toString(),
        { isDeleted: m.isDeleted, isBanned: m.isBanned },
      ]),
    );

    const toRestore: string[] = [];
    const toInsert: string[] = [];
    const skippedBanned: string[] = []; // optional: track ignored banned users

    for (const id of userIds) {
      const existingMember = existingMap.get(id);

      // Skip banned users entirely, do not restore or insert them
      if (existingMember?.isBanned) {
        skippedBanned.push(id);
        continue;
      }

      if (existingMember === undefined) {
        toInsert.push(id);
      } else if (existingMember.isDeleted === true) {
        toRestore.push(id);
      }
      // if existingMember exists and isDeleted === false, user is already a member, skip
    }

    if (toRestore.length > 0) {
      await this.membersRepository.updateMany({
        query: {
          space: spaceObjectId,
          user: { $in: toRestore.map((id) => new Types.ObjectId(id)) },
          isDeleted: true,
        },
        dto: {
          isDeleted: false,
          isBanned: false,
          bannedAt: null,
          deletedAt: null,
          joinedAt: new Date(),
        },
      });
    }

    if (toInsert.length > 0) {
      await this.membersRepository.insertMany({
        documents: toInsert.map((userId) => ({
          user: new Types.ObjectId(userId),
          space: spaceObjectId,
          role: SpaceMemberRole.MEMBER,
          joinedAt: new Date(),
          isPined: false,
          isMuted: false,
          isArchived: false,
          permissions: [],
        })),
      });
    }

    const total = toRestore.length + toInsert.length;
    if (total === 0) {
      return {
        space: await this.spacesRepository.findOne({
          query: { _id: spaceObjectId },
        }),
        addedUserIds: [],
        skippedBanned, // optional
      };
    }

    const updateSpace = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: total } },
    });

    return {
      space: {
        ...updateSpace.toObject(),
        id: updateSpace._id?.toString(),
        _id: undefined,
      },
      addedUserIds: [...toInsert, ...toRestore],
      skippedBanned, // optional
    };
  }
}
