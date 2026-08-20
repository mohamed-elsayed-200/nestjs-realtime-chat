import { GetSingleSpaceService } from './get-single-space.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { SpaceTypes } from '../../../../../common/types/enums';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { JoinRequestsRepository } from '../../../../../common/modules/platform/join-requests/join-requests.repository';
import { Types } from 'mongoose';

@Injectable()
export class OpenLinkSpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
    private readonly getSingleSpaceService: GetSingleSpaceService,
  ) {}
  public async open({ dto, authUser }) {
    const { linkText, linkType } = dto;
    let query: any = {};

    if (linkType === SpaceTypes.CHANNEL) {
      query = { 'settings.channel.channelLink': linkText };
    } else if (linkType === SpaceTypes.GROUP) {
      query = { 'settings.group.groupLink': linkText };
    } else if (linkType === SpaceTypes.COMMUNITY) {
      query = { 'settings.community.communityLink': linkText };
    } else {
      throw new BadRequestException('spaces.invalidLinkType');
    }

    const findSpace = await this.spacesRepository.findOne({ query });
    if (!findSpace)
      return {
        isDeleted: true,
      };

    const spaceId = new Types.ObjectId(findSpace?._id);
    const userId = new Types.ObjectId(authUser?._id);

    const findRequest = await this.joinRequestsRepository.findOne({
      query: { space: spaceId, user: userId },
    });
    const getSpace = await this.getSingleSpaceService.get({
      spaceOrUserId: spaceId,
      authUser,
    });

    return {
      ...getSpace,
      joinRequest: findRequest || undefined,
    };
  }
}
