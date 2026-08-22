import { Injectable } from '@nestjs/common';
import { SpaceTypes } from '../../../../../common/types/enums';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { QueryDto } from '../../../../../common/modules/dto/query.dto';

@Injectable()
export class GetSpacesService {
  constructor(private readonly spacesRepository: SpacesRepository) {}

  async get({ query }) {
    const { spaceType, ...otherQuery } = query;
    const isPrivate = spaceType === SpaceTypes.PRIVATE;
    const pipelines: any[] = [];

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

    pipelines.push({
      $lookup: {
        from: 'messages',
        localField: 'lastMessage',
        foreignField: '_id',
        as: 'lastMessageDoc',
      },
    });

    if (isPrivate) {
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
            {
              $project: {
                _id: 0,
                name: '$userDoc.name',
                avatar: '$userDoc.avatar',
                profileColor: '$userDoc.profileColor',
              },
            },
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

      if (otherQuery.search) {
        pipelines.push({
          $match: { chatName: { $regex: otherQuery.search, $options: 'i' } },
        });
      }
    } else {
      // Resolve the owner from `createdBy`
      pipelines.push(
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'ownerDoc',
          },
        },
        {
          $addFields: {
            owner: {
              $let: {
                vars: { u: { $arrayElemAt: ['$ownerDoc', 0] } },
                in: {
                  _id: '$$u._id',
                  name: '$$u.name',
                  avatar: '$$u.avatar',
                  profileColor: '$$u.profileColor',
                  email: '$$u.email',
                  username: '$$u.username',
                },
              },
            },
          },
        },
        { $project: { ownerDoc: 0 } },
      );

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

    // Normalize the incoming filter to always be array-format, then append
    // the `type` filter (derived from spaceType) as one more item in it.
    // This keeps status/other filters intact instead of being overwritten.
    const incomingFilter = otherQuery.filter;
    const normalizedFilter: any[] = Array.isArray(incomingFilter)
      ? incomingFilter
      : incomingFilter
        ? Object.entries(incomingFilter).map(([field, value]) => ({
            field,
            operator: Array.isArray(value) ? 'in' : 'eq',
            value,
          }))
        : [];

    const sanitizedQuery: QueryDto = {
      ...otherQuery,
      search: isPrivate ? undefined : otherQuery.search,
      filter: [
        ...normalizedFilter,
        { field: 'type', operator: 'eq', value: spaceType },
      ],
    };

    return this.spacesRepository.findAll({
      query: sanitizedQuery,
      options: {
        pipelines,
        sort: { lastActivity: -1 },
        allowedFilterFields: ['type', 'status'],
        allowedSearchFields: isPrivate ? [] : ['name'],
      },
    });
  }
}
