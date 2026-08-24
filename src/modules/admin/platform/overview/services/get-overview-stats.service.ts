import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { SpaceTypes } from '../../../../../common/types/enums';

@Injectable()
export class GetOverviewStatsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly callsRepository: CallsRepository,
  ) {}

  public async get() {
    const now = dayjs();
    const startOfThisMonth = now.startOf('month').toDate();
    const startOfLastMonth = now.subtract(1, 'month').startOf('month').toDate();
    const endOfLastMonth = now.startOf('month').toDate();

    const [
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      totalMessages,
      messagesThisMonth,
      messagesLastMonth,
      totalGroups,
      groupsThisMonth,
      groupsLastMonth,
      totalCalls,
      callsThisMonth,
      callsLastMonth,
    ] = await Promise.all([
      this.usersRepository.count({ query: {} }),
      this.usersRepository.count({
        query: { createdAt: { $gte: startOfThisMonth } },
      }),
      this.usersRepository.count({
        query: {
          createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
        },
      }),

      this.messagesRepository.count({ query: {} }),
      this.messagesRepository.count({
        query: { createdAt: { $gte: startOfThisMonth } },
      }),
      this.messagesRepository.count({
        query: {
          createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
        },
      }),

      this.spacesRepository.count({ query: { type: SpaceTypes.GROUP } }),
      this.spacesRepository.count({
        query: {
          type: SpaceTypes.GROUP,
          createdAt: { $gte: startOfThisMonth },
        },
      }),
      this.spacesRepository.count({
        query: {
          type: SpaceTypes.GROUP,
          createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
        },
      }),

      this.callsRepository.count({ query: {} }),
      this.callsRepository.count({
        query: { createdAt: { $gte: startOfThisMonth } },
      }),
      this.callsRepository.count({
        query: {
          createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
        },
      }),
    ]);

    return {
      users: this.buildStat(totalUsers, usersThisMonth, usersLastMonth),
      messages: this.buildStat(
        totalMessages,
        messagesThisMonth,
        messagesLastMonth,
      ),
      groups: this.buildStat(totalGroups, groupsThisMonth, groupsLastMonth),
      calls: this.buildStat(totalCalls, callsThisMonth, callsLastMonth),
    };
  }

  private buildStat(total: number, thisMonth: number, lastMonth: number) {
    const change =
      lastMonth === 0
        ? thisMonth > 0
          ? 100
          : 0
        : Number((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1));

    return { total, changePercent: change };
  }
}
