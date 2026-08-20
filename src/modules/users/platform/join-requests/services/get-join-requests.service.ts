import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from './../../../../../common/types/enums';
import { JoinRequestsRepository } from './../../../../../common/modules/platform/join-requests/join-requests.repository';
import { MembersRepository } from './../../../../../common/modules/platform/members/members.repository';
import { JoinRequestStatus } from '../../../../../common/modules/platform/join-requests/join-request.schema';
import { emptyAggregateQuery } from '../../../../../common/modules/data-access/aggregate-query';

@Injectable()
export class GetJoinRequestsService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
  ) {}

  public async get({ query, space, authUser }) {
    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser?._id);

    // check access get requests list
    const findMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    const isOwner = findMember?.role === SpaceMemberRole.OWNER;
    const isAdmin = findMember?.role === SpaceMemberRole.ADMIN;
    const iCanManageJoinRequests = findMember?.permissions?.includes(
      SpaceMemberPermission.MANAGE_JOIN_REQUESTS,
    );

    if (!isOwner && !(isAdmin && iCanManageJoinRequests))
      return emptyAggregateQuery;

    let match = {};

    if (isOwner || isAdmin) {
      match = { space: spaceObjectId };
    } else {
      match = { user: userObjectId };
    }

    return await this.joinRequestsRepository.findAll({
      query,
      options: {
        allowedSearchFields: [],
        allowedFilterFields: ['status'],
        pipelines: [
          {
            $match: match,
          },
          {
            $addFields: {
              sortPriority: {
                $cond: {
                  if: { $eq: ['$status', JoinRequestStatus.PENDING] },
                  then: 0,
                  else: 1,
                },
              },
            },
          },
          {
            $sort: {
              sortPriority: 1,
              createdAt: -1,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              space: 1,
              status: 1,
              message: 1,
              reviewedAt: 1,
              rejectionReason: 1,
              createdAt: 1,
              user: {
                id: '$user._id',
                name: '$user.name',
                avatar: '$user.avatar',
                profileColor: '$user.profileColor',
              },
            },
          },
        ],
      },
    });
  }
}
