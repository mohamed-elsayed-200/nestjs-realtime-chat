import { Injectable } from '@nestjs/common';
import { ActivationStatus } from '../../../../../common/types/enums';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import dayjs from 'dayjs';

@Injectable()
export class GetMessagingStatsService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}

  async get({ spaceType }) {
    const startOfDay = dayjs().startOf('day').toDate();

    const totalChats = await this.spacesRepository.count({
      query: {
        type: spaceType,
        status: ActivationStatus.ACTIVE,
      },
    });

    const activeToday = await this.spacesRepository.count({
      query: {
        type: spaceType,
        updatedAt: { $gte: startOfDay },
      },
    });

    const messagesTodayResult = await this.messagesRepository.aggregate({
      pipeline: [
        { $match: { createdAt: { $gte: startOfDay } } },
        {
          $lookup: {
            from: 'spaces',
            localField: 'space',
            foreignField: '_id',
            as: 'spaceDoc',
          },
        },
        { $unwind: '$spaceDoc' },
        { $match: { 'spaceDoc.type': spaceType } },
        { $count: 'total' },
      ],
    });

    return {
      totalChats,
      activeToday,
      messagesToday: messagesTodayResult[0]?.total ?? 0,
    };
  }
}
