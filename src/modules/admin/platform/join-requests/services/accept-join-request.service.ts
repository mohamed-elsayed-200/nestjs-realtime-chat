import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  memberPermissionList,
  SpaceMemberPermission,
  SpaceMemberRole,
} from './../../../../../common/types/enums';
import { JoinRequestsRepository } from './../../../../../common/modules/platform/join-requests/join-requests.repository';
import { MembersRepository } from './../../../../../common/modules/platform/members/members.repository';
import { UsersRepository } from './../../../../../common/modules/iam/users/users.repository';
import { SpacesRepository } from './../../../../../common/modules/platform/spaces/spaces.repository';

@Injectable()
export class AcceptJoinRequestService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}

  public async accept({ dto, authUser }) {
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
      const updateMember = await this.membersRepository.updateOne({
        query: { _id: insideMember._id },
        dto: {
          isDeleted: false,
          role: SpaceMemberRole.MEMBER,
          permissions: insideMember?.permissions?.filter((perm) =>
            memberPermissionList?.includes(perm),
          ),
          addedBy: userObjectId,
          joinedAt: new Date(),
        },
      });
      if (!updateMember)
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

    const findUser = await this.usersRepository.findOne({
      query: { _id: findRequest.user },
      select: 'name profileColor avatar username',
    });

    await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: 1 } },
    });
    return {
      id: findRequest._id,
      space: findRequest.space,
      user: findUser,
    };
  }
}
