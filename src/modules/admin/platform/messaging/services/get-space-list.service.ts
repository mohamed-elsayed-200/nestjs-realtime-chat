import { Injectable } from '@nestjs/common';
import { SpaceTypes } from '../../../../../common/types/enums';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { QueryDto } from '../../../../../common/modules/dto/query.dto';

@Injectable()
export class GetSpacesListService {
  constructor(private readonly spacesRepository: SpacesRepository) {}

  async get({ query }) {
    const { spaceType, ...otherQuery } = query;
    const isPrivate = spaceType === SpaceTypes.PRIVATE;
    const pipelines: any[] = [];

    // Count messages per space
    // Note: this lookup can get heavy at scale, consider denormalizing
    // messagesCount on the Space document later if needed
    pipelines.push({
      $lookup: {
        from: 'messages',
        let: { spaceId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$space', '$$spaceId'] } } },
          { $count: 'count' },
        ],
        as: 'messagesAgg',
      },
    });

    // Resolve last activity from lastMessage, fallback to space.updatedAt
    pipelines.push({
      $lookup: {
        from: 'messages',
        localField: 'lastMessage',
        foreignField: '_id',
        as: 'lastMessageDoc',
      },
    });

    if (isPrivate) {
      // Private spaces have no `name`, build a display name from both members
      pipelines.push({
        $lookup: {
          from: 'members',
          let: { spaceId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$space', '$$spaceId'] },
                isDeleted: false,
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDoc',
              },
            },
            { $unwind: '$userDoc' },
            { $project: { _id: 0, name: '$userDoc.name' } },
          ],
          as: 'participants',
        },
      });

      pipelines.push({
        $addFields: {
          chatName: {
            $reduce: {
              input: '$participants.name',
              initialValue: '',
              in: {
                $cond: [
                  { $eq: ['$$value', ''] },
                  '$$this',
                  { $concat: ['$$value', ' & ', '$$this'] },
                ],
              },
            },
          },
          participantsCount: { $size: '$participants' },
        },
      });

      // chatName only exists after the $addFields above, so we search here
      // manually instead of relying on the generic allowedSearchFields
      if (otherQuery.search) {
        pipelines.push({
          $match: { chatName: { $regex: otherQuery.search, $options: 'i' } },
        });
      }
    } else {
      // Group / Channel / Community already have `name` and `membersCount`
      pipelines.push({
        $addFields: {
          chatName: '$name',
          participantsCount: '$membersCount',
        },
      });
    }

    pipelines.push({
      $addFields: {
        messagesCount: {
          $ifNull: [{ $arrayElemAt: ['$messagesAgg.count', 0] }, 0],
        },
        lastActivity: {
          $ifNull: [
            { $arrayElemAt: ['$lastMessageDoc.createdAt', 0] },
            '$updatedAt',
          ],
        },
      },
    });

    const existingFilter =
      otherQuery.filter && !Array.isArray(otherQuery.filter)
        ? otherQuery.filter
        : {};

    const sanitizedQuery: QueryDto = {
      ...otherQuery,
      // Skip the generic search entirely for private chats — we already
      // handled it above against the computed chatName field
      search: isPrivate ? undefined : otherQuery.search,
      filter: { ...existingFilter, type: spaceType },
    };

    return this.spacesRepository.findAll({
      query: sanitizedQuery,
      options: {
        pipelines,
        allowedFilterFields: ['type', 'status'],
        // For non-private types, `name` exists directly on the raw Space doc
        // so the generic search can match it before the pipeline even runs
        allowedSearchFields: isPrivate ? [] : ['name'],
        sort: { lastActivity: -1 },
        includeFields: [
          '_id',
          'chatName',
          'participantsCount',
          'messagesCount',
          'lastActivity',
          'status',
          'type',
        ],
      },
    });
  }
}
