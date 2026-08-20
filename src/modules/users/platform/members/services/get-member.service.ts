import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { BannedRepository } from '../../../../../common/modules/platform/banned/banned.repository';

@Injectable()
export class GetMemberService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly bannedRepository: BannedRepository,
  ) {}

  public async get({ query, authUser }) {
    const { memberId, userId, spaceId } = query;
    let finalQuery: any = {};
    if (memberId) {
      finalQuery._id = new Types.ObjectId(memberId);
    }
    if (userId) {
      finalQuery.user = new Types.ObjectId(userId);
    }
    if (spaceId) {
      finalQuery.space = new Types.ObjectId(spaceId);
    }

    if (!memberId && !userId && !spaceId)
      throw new NotFoundException('members.notFoundOne');

    const member: any = await this.membersRepository.findOne({
      query: finalQuery,
      populate: [
        {
          path: 'user',
          model: 'User',
          select: 'name avatar profileColor username bio',
        },
        {
          path: 'bannedBy',
          model: 'User',
          select: 'name avatar profileColor username',
        },
        {
          path: 'promotedBy',
          model: 'User',
          select: 'name avatar profileColor username',
        },
        {
          path: 'addedBy',
          model: 'User',
          select: 'name avatar profileColor username',
        },
        {
          path: 'space',
          model: 'Space',
          select: 'name profileColor avatar type',
        },
      ],
      select:
        'isBanned addedBy promotedBy deletedAt bannedAt joinedAt role adminTag adminTagColor isDeleted user bannedBy space permissions bannedReason',
    });

    if (!member) throw new NotFoundException('members.notFoundOne');

    let theyBlockedMe = false;
    if (member.user?._id && authUser?._id) {
      const result = await this.bannedRepository.findBothDirections({
        userA: authUser._id.toString(),
        userB: member.user._id.toString(),
      });
      theyBlockedMe = Boolean(result.theyBlockedMe);
    }

    return {
      ...member,
      user: {
        ...member.user,
        avatar: theyBlockedMe ? null : member.user?.avatar,
        theyBlockedMe,
      },
    };
  }
}
