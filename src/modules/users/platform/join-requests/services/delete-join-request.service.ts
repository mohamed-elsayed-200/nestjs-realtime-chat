import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SpaceMemberRole } from './../../../../../common/types/enums';
import { JoinRequestsRepository } from './../../../../../common/modules/platform/join-requests/join-requests.repository';
import { MembersRepository } from './../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class DeleteJoinRequestService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
  ) {}

  public async delete({ request, authUser }) {
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
