import { BadRequestException, Injectable } from '@nestjs/common';
import { BannedRepository } from '../../../../../common/modules/platform/banned/banned.repository';
import { Types } from 'mongoose';

@Injectable()
export class AssertNotBannedService {
  constructor(private readonly bannedRepository: BannedRepository) {}

  public async assert({ userA, userB }) {
    const block = await this.bannedRepository.findEitherDirection({
      userA,
      userB,
    });
    if (block) {
      throw new BadRequestException('blocks.userBanned');
    }
    return block;
  }
}
