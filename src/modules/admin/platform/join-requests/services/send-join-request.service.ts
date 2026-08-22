import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JoinApproval, SpaceTypes } from './../../../../../common/types/enums';
import { JoinRequestsRepository } from './../../../../../common/modules/platform/join-requests/join-requests.repository';
import { SpacesRepository } from './../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from './../../../../../common/modules/platform/members/members.repository';
import { JoinRequestStatus } from '../../../../../common/modules/platform/join-requests/join-request.schema';

@Injectable()
export class SendJoinRequestService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
  ) {}
  public async send({ dto, authUser }) {
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
}
