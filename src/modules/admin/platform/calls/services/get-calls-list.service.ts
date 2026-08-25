import { Injectable } from '@nestjs/common';
import { CallStatus } from '../../../../../common/types/enums';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';

const ONGOING_STATUSES = [
  CallStatus.INITIATED,
  CallStatus.RINGING,
  CallStatus.IN_PROGRESS,
];

@Injectable()
export class GetCallsListService {
  constructor(private readonly callsRepository: CallsRepository) {}

  async get({ query }) {
    const pipelines: any[] = [];

    pipelines.push(
      {
        $lookup: {
          from: 'users',
          localField: 'caller',
          foreignField: '_id',
          as: 'callerDoc',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiverDoc',
        },
      },
      {
        $addFields: {
          caller: {
            $let: {
              vars: { u: { $arrayElemAt: ['$callerDoc', 0] } },
              in: {
                _id: '$$u._id',
                name: '$$u.name',
                avatar: '$$u.avatar',
                profileColor: '$$u.profileColor',
              },
            },
          },
          receiver: {
            $let: {
              vars: { u: { $arrayElemAt: ['$receiverDoc', 0] } },
              in: {
                _id: '$$u._id',
                name: '$$u.name',
                avatar: '$$u.avatar',
                profileColor: '$$u.profileColor',
              },
            },
          },
        },
      },
      { $project: { callerDoc: 0, receiverDoc: 0 } },
    );

    pipelines.push({
      $addFields: {
        displayName: {
          $cond: [
            '$isConference',
            { $concat: [{ $toString: '$participantsCount' }, ' Participants'] },
            {
              $concat: [
                { $ifNull: ['$caller.name', 'Unknown'] },
                ' \u2194 ',
                { $ifNull: ['$receiver.name', 'Unknown'] },
              ],
            },
          ],
        },
        isOngoing: { $in: ['$status', ONGOING_STATUSES] },
        // Live duration for ongoing calls, stored duration for ended ones
        computedDuration: {
          $cond: [
            { $in: ['$status', ONGOING_STATUSES] },
            {
              $cond: [
                { $ifNull: ['$startedAt', false] },
                {
                  $dateDiff: {
                    startDate: '$startedAt',
                    endDate: '$$NOW',
                    unit: 'second',
                  },
                },
                0,
              ],
            },
            { $ifNull: ['$duration', 0] },
          ],
        },
      },
    });

    return this.callsRepository.findAll({
      query,
      options: {
        pipelines,
        sort: { createdAt: -1 },
        allowedFilterFields: ['status', 'scope', 'isConference', 'type'],
      },
    });
  }
}
