import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  JoinApproval,
  memberPermissionList,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from './../../../../common/types/enums';
import { JoinRequestsRepository } from './../../../../common/modules/platform/join-requests/join-requests.repository';
import { SpacesRepository } from './../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from './../../../../common/modules/platform/members/members.repository';
import { JoinRequestStatus } from '../../../../common/modules/platform/join-requests/join-request.schema';
import { emptyAggregateQuery } from 'src/common/modules/data-access/aggregate-query';

@Injectable()
export class JoinRequestsService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
  ) {}

  public async getAll({ query, space, authUser }) {
    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser?._id);

    // check access get requests list
    const findMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    const isOwner = findMember?.role === SpaceMemberRole.OWNER;
    const isAdmin = findMember?.role === SpaceMemberRole.ADMIN;
    const iCanManageJoinRequests = findMember.permissions.includes(
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

  public async sendRequest({ dto, authUser }) {
    const { space } = dto;
    const userObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(space);

    // find channel space
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    // check this user not inside this space channel
    const findMember = await this.membersRepository.findOne({
      query: { user: userObjectId, space: spaceObjectId },
    });
    if (findMember && findMember?.isDeleted === false)
      throw new BadRequestException('joinRequests.userAlreadyJoined');

    // check is channel space need to join request for access
    const settings =
      findSpace.type === SpaceTypes.CHANNEL
        ? findSpace.settings.channel
        : findSpace.settings.group;

    const isPublic = settings.joinApproval === JoinApproval.ANYONE_CAN_JOIN;
    if (isPublic) throw new BadRequestException('spaces.isPublic');

    // if find join request return the request existed
    const findRequest = await this.joinRequestsRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    const isCancelled =
      findRequest && findRequest?.status === JoinRequestStatus.CANCELLED;
    const isPending =
      findRequest && findRequest?.status === JoinRequestStatus.PENDING;

    if (isPending) {
      return findRequest;
    } else if (isCancelled) {
      const updatedRequest = await this.joinRequestsRepository.updateOne({
        query: { _id: findRequest._id },
        dto: { status: JoinRequestStatus.PENDING },
      });
      return updatedRequest;
    } else {
      // create join request
      const newRequest = await this.joinRequestsRepository.createOne({
        dto: {
          user: userObjectId,
          space: spaceObjectId,
          status: JoinRequestStatus.PENDING,
          message: dto?.message,
        },
      });
      if (!newRequest)
        throw new InternalServerErrorException('joinRequests.notCreated');
      return newRequest;
    }
  }

  public async acceptRequest({ dto, authUser }) {
    const { space, request } = dto;
    const userObjectId = new Types.ObjectId(authUser._id);
    const spaceObjectId = new Types.ObjectId(space);
    const requestObjectId = new Types.ObjectId(request);

    // check permissions accept
    const findMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    const isOwner = findMember.role === SpaceMemberRole.OWNER;
    const isAdmin = findMember.role === SpaceMemberRole.ADMIN;
    const iCanManageJoinRequests = findMember.permissions.includes(
      SpaceMemberPermission.MANAGE_JOIN_REQUESTS,
    );

    if (!isOwner && !(isAdmin && iCanManageJoinRequests)) {
      throw new BadRequestException('joinRequest.notAllowed');
    }

    // find the request join
    const findRequest = await this.joinRequestsRepository.findOne({
      query: { _id: requestObjectId },
    });
    if (!findRequest) throw new NotFoundException('joinRequests.notFound');

    // check this user not inside this space channel
    const insideMember = await this.membersRepository.findOne({
      query: { user: findRequest.user, space: spaceObjectId },
    });
    if (insideMember) {
      const newMember = await this.membersRepository.updateOne({
        query: { _id: insideMember._id },
        dto: {
          isDeleted: false,
          role: SpaceMemberRole.MEMBER,
          permissions: memberPermissionList,
          addedBy: userObjectId,
          joinedAt: new Date(),
        },
      });
      if (!newMember)
        throw new InternalServerErrorException('joinRequests.failedAccepted');
    } else if (!insideMember) {
      // create new member
      const newMember = await this.membersRepository.createOne({
        dto: {
          user: findRequest.user,
          space: spaceObjectId,
          role: SpaceMemberRole.MEMBER,
          permissions: memberPermissionList,
          addedBy: userObjectId,
          joinedAt: new Date(),
        },
      });
      if (!newMember)
        throw new InternalServerErrorException('joinRequests.failedAccepted');
    }

    // accepted request
    const acceptRequest = await this.joinRequestsRepository.deleteOne({
      query: { _id: requestObjectId },
    });
    if (!acceptRequest)
      throw new NotFoundException('joinRequests.failedAccepted');

    await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: 1 } },
    });
    return findRequest;
  }

  public async rejectRequest({ dto, authUser }) {
    const { space, request, rejectionReason } = dto;
    const userObjectId = new Types.ObjectId(authUser._id);
    const spaceObjectId = new Types.ObjectId(space);
    const requestObjectId = new Types.ObjectId(request);

    // check permissions accept
    const findMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    const isOwner = findMember.role === SpaceMemberRole.OWNER;
    const isAdmin = findMember.role === SpaceMemberRole.ADMIN;
    const isAllowed = isOwner || isAdmin;
    if (!isAllowed) throw new BadRequestException('joinRequest.notAllowed');

    // find the request join
    const findRequest = await this.joinRequestsRepository.findOne({
      query: { _id: requestObjectId },
    });
    if (!findRequest) throw new NotFoundException('joinRequests.notFound');

    // check this user not inside this space channel
    const insideMember = await this.membersRepository.findOne({
      query: { user: findRequest.user, space: spaceObjectId },
    });
    if (insideMember && insideMember?.isDeleted === false)
      throw new BadRequestException('joinRequests.userAlreadyJoined');

    // reject request
    const rejectedRequest = await this.joinRequestsRepository.updateOne({
      query: { _id: requestObjectId },
      dto: {
        status: JoinRequestStatus.REJECTED,
        reviewedBy: userObjectId,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });
    if (!rejectedRequest)
      throw new NotFoundException('joinRequests.failedRejected');

    return rejectedRequest;
  }

  public async cancelRequest({ request, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const requestObjectId = new Types.ObjectId(request);

    const findRequest = await this.joinRequestsRepository.deleteOne({
      query: { _id: requestObjectId, user: userObjectId },
    });

    if (!findRequest)
      throw new InternalServerErrorException('joinRequests.failedCancelled');
    return findRequest;
  }

  public async deleteRequest({ request, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const requestObjectId = new Types.ObjectId(request);

    // check request already exist
    const findRequest = await this.joinRequestsRepository.findOne({
      query: { _id: requestObjectId },
    });
    if (!findRequest) throw new NotFoundException('joinRequests.notFoundOne');

    // check member already exist
    const findMember = await this.membersRepository.findOne({
      query: { user: userObjectId, space: findRequest.space },
    });
    if (!findMember)
      throw new BadRequestException('joinRequests.yourNeedPermissions');

    // check member have permissions
    const isOwner = findMember.role === SpaceMemberRole.OWNER;
    const isAdmin = findMember.role === SpaceMemberRole.ADMIN;
    const isAllowedDelete = isOwner || isAdmin;
    if (!isAllowedDelete)
      throw new BadRequestException('joinRequests.yourNeedPermissions');

    // delete request
    const deletedRequest = await this.joinRequestsRepository.deleteOne({
      query: { _id: requestObjectId },
    });
    if (!deletedRequest)
      throw new InternalServerErrorException('joinRequests.failedCreated');
    return deletedRequest;
  }
}
