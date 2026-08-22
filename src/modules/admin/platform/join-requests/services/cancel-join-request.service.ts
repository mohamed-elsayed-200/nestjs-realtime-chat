import { Types } from 'mongoose';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JoinRequestsRepository } from './../../../../../common/modules/platform/join-requests/join-requests.repository';

@Injectable()
export class CancelJoinRequestService {
  constructor(
    private readonly joinRequestsRepository: JoinRequestsRepository,
  ) {}
  public async cancel({ request, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const requestObjectId = new Types.ObjectId(request);

    const findRequest = await this.joinRequestsRepository.deleteOne({
      query: { _id: requestObjectId, user: userObjectId },
    });

    if (!findRequest)
      throw new InternalServerErrorException('joinRequests.failedCancelled');
    return findRequest;
  }
}
