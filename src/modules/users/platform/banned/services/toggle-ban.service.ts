import { BadRequestException, Injectable } from '@nestjs/common';
import { BannedRepository } from '../../../../../common/modules/platform/banned/banned.repository';
import { Types } from 'mongoose';

@Injectable()
export class ToggleBanService {
  constructor(private readonly bannedRepository: BannedRepository) {}

  public async toggle({ userId, authUser }) {
    const authUserObjectId = new Types.ObjectId(authUser?._id);
    const userObjectId = new Types.ObjectId(userId);

    if (userObjectId?.toString() === authUserObjectId?.toString()) {
      throw new BadRequestException('blocks.cannotBlockSelf');
    }

    const existing = await this.bannedRepository.findOne({
      query: { bannedBy: authUserObjectId, bannedUser: userObjectId },
    });

    if (existing) {
      await this.bannedRepository.deleteOne({
        query: { bannedBy: authUserObjectId, bannedUser: userObjectId },
      });

      return {
        blocked: false,
        userId: userObjectId,
      };
    }

    await this.bannedRepository.createOne({
      dto: { bannedBy: authUserObjectId, bannedUser: userObjectId },
    });
    return {
      blocked: true,
      userId: userObjectId,
    };
  }
}
