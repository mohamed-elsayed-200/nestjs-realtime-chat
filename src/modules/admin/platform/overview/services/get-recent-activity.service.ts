import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { SpaceTypes, UserType } from '../../../../../common/types/enums';

export interface ActivityItem {
  type:
    | 'user_joined'
    | 'group_created'
    | 'channel_created'
    | 'community_created';
  title: string;
  subtitle: string;
  createdAt: Date;
}

@Injectable()
export class GetRecentActivityService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}

  public async get({
    limit = 10,
  }: {
    limit?: number;
  }): Promise<ActivityItem[]> {
    const [users, groups, channels, communities] = await Promise.all([
      this.usersRepository.findRecent({
        query: { userType: UserType.USER },
        limit,
      }),
      this.spacesRepository.findRecent({
        query: { type: SpaceTypes.GROUP },
        limit,
      }),
      this.spacesRepository.findRecent({
        query: { type: SpaceTypes.CHANNEL },
        limit,
      }),
      this.spacesRepository.findRecent({
        query: { type: SpaceTypes.COMMUNITY },
        limit,
      }),
    ]);

    const items: ActivityItem[] = [
      ...users.map((u: any) => ({
        type: 'user_joined' as const,
        title: 'New user joined',
        subtitle: u.name,
        createdAt: u.createdAt,
      })),
      ...groups.map((g: any) => ({
        type: 'group_created' as const,
        title: 'New group created',
        subtitle: g.name,
        createdAt: g.createdAt,
      })),
      ...channels.map((c: any) => ({
        type: 'channel_created' as const,
        title: 'New channel created',
        subtitle: c.name,
        createdAt: c.createdAt,
      })),
      ...communities.map((c: any) => ({
        type: 'community_created' as const,
        title: 'Community created',
        subtitle: c.name,
        createdAt: c.createdAt,
      })),
    ];

    return items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
