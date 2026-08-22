import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpaceMemberRole } from './../../../../../common/types/enums';
import { JoinRequestsRepository } from './../../../../../common/modules/platform/join-requests/join-requests.repository';
import { MembersRepository } from './../../../../../common/modules/platform/members/members.repository';
import { JoinRequestStatus } from '../../../../../common/modules/platform/join-requests/join-request.schema';

@Injectable()
export class RejectJoinRequestService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
  ) {}

  public async reject({ dto, authUser }) {
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
}
