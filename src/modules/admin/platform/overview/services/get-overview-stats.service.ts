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

      messagesVsPosts,

      totalGroups,
      groupsThisMonth,
      groupsLastMonth,

      totalChannels,
      channelsThisMonth,
      channelsLastMonth,

      totalCommunities,
      communitiesThisMonth,
      communitiesLastMonth,

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

      this.getMessagesAndPostsStats(
        startOfThisMonth,
        startOfLastMonth,
        endOfLastMonth,
      ),

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

      this.spacesRepository.count({ query: { type: SpaceTypes.CHANNEL } }),
      this.spacesRepository.count({
        query: {
          type: SpaceTypes.CHANNEL,
          createdAt: { $gte: startOfThisMonth },
        },
      }),
      this.spacesRepository.count({
        query: {
          type: SpaceTypes.CHANNEL,
          createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
        },
      }),

      this.spacesRepository.count({ query: { type: SpaceTypes.COMMUNITY } }),
      this.spacesRepository.count({
        query: {
          type: SpaceTypes.COMMUNITY,
          createdAt: { $gte: startOfThisMonth },
        },
      }),
      this.spacesRepository.count({
        query: {
          type: SpaceTypes.COMMUNITY,
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
        messagesVsPosts.totalMessages,
        messagesVsPosts.messagesThisMonth,
        messagesVsPosts.messagesLastMonth,
      ),
      posts: this.buildStat(
        messagesVsPosts.totalPosts,
        messagesVsPosts.postsThisMonth,
        messagesVsPosts.postsLastMonth,
      ),
      groups: this.buildStat(totalGroups, groupsThisMonth, groupsLastMonth),
      channels: this.buildStat(
        totalChannels,
        channelsThisMonth,
        channelsLastMonth,
      ),
      communities: this.buildStat(
        totalCommunities,
        communitiesThisMonth,
        communitiesLastMonth,
      ),
      calls: this.buildStat(totalCalls, callsThisMonth, callsLastMonth),
    };
  }

  /**
   * "Posts" are just Messages sent inside a Space of type CHANNEL.
   * Regular "Messages" are everything else (private / group / community).
   * We join Message -> Space once and bucket everything in a single aggregation.
   */
  private async getMessagesAndPostsStats(
    startOfThisMonth: Date,
    startOfLastMonth: Date,
    endOfLastMonth: Date,
  ) {
    const pipeline = [
      {
        $lookup: {
          from: 'spaces', // اسم الكولكشن الفعلي - عدّله لو مختلف عندك
          localField: 'space',
          foreignField: '_id',
          as: 'spaceDoc',
        },
      },
      { $unwind: '$spaceDoc' },
      {
        $facet: {
          totalMessages: [
            { $match: { 'spaceDoc.type': { $ne: SpaceTypes.CHANNEL } } },
            { $count: 'count' },
          ],
          messagesThisMonth: [
            {
              $match: {
                'spaceDoc.type': { $ne: SpaceTypes.CHANNEL },
                createdAt: { $gte: startOfThisMonth },
              },
            },
            { $count: 'count' },
          ],
          messagesLastMonth: [
            {
              $match: {
                'spaceDoc.type': { $ne: SpaceTypes.CHANNEL },
                createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
              },
            },
            { $count: 'count' },
          ],
          totalPosts: [
            { $match: { 'spaceDoc.type': SpaceTypes.CHANNEL } },
            { $count: 'count' },
          ],
          postsThisMonth: [
            {
              $match: {
                'spaceDoc.type': SpaceTypes.CHANNEL,
                createdAt: { $gte: startOfThisMonth },
              },
            },
            { $count: 'count' },
          ],
          postsLastMonth: [
            {
              $match: {
                'spaceDoc.type': SpaceTypes.CHANNEL,
                createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ];

    const [result] = await this.messagesRepository.aggregate({ pipeline });

    const extract = (bucket: any[]) => bucket?.[0]?.count ?? 0;

    return {
      totalMessages: extract(result?.totalMessages),
      messagesThisMonth: extract(result?.messagesThisMonth),
      messagesLastMonth: extract(result?.messagesLastMonth),
      totalPosts: extract(result?.totalPosts),
      postsThisMonth: extract(result?.postsThisMonth),
      postsLastMonth: extract(result?.postsLastMonth),
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
