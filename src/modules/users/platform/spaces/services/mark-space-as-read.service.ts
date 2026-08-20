import { Injectable } from '@nestjs/common';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class MarkSpaceAsReadService {
  constructor(private readonly membersRepository: MembersRepository) {}
  public async mark({ spaceId, authUser }) {
    await this.membersRepository.markUnreadCountAsRead({ spaceId, authUser });
  }
}
