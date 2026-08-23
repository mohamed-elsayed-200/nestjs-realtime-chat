// get-calls-list.service.ts
import { Injectable } from '@nestjs/common';
import { CallStatus } from '../../../../../common/types/enums';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { CallsTab } from '../dto/get-calls-query.dto';

const ONGOING_STATUSES = [
  CallStatus.INITIATED,
  CallStatus.RINGING,
  CallStatus.IN_PROGRESS,
];

const ENDED_STATUSES = [
  CallStatus.COMPLETED,
  CallStatus.MISSED,
  CallStatus.REJECTED,
  CallStatus.FAILED,
];

@Injectable()
export class GetCallsListService {
  constructor(private readonly callsRepository: CallsRepository) {}

  async get({ query }) {
    const { tab, ...otherQuery } = query;
    const pipelines: any[] = [];

    // Resolve caller/receiver as single objects (not arrays), same pattern
    // used for sender/received on private Spaces
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

    // participantsCount is already maintained on the Call document itself,
    // no lookup on the Participant collection needed for the list view
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

    const tabFilter: any[] = [];
    if (tab === CallsTab.ACTIVE) {
      tabFilter.push({
        field: 'status',
        operator: 'in',
        value: ONGOING_STATUSES,
      });
    } else if (tab === CallsTab.HISTORY) {
      tabFilter.push({
        field: 'status',
        operator: 'in',
        value: ENDED_STATUSES,
      });
    } else if (tab === CallsTab.MEETINGS) {
      tabFilter.push({ field: 'isConference', operator: 'eq', value: true });
    }

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

    return this.callsRepository.findAll({
      query: {
        ...otherQuery,
        filter: [...normalizedFilter, ...tabFilter],
      },
      options: {
        pipelines,
        sort: { createdAt: -1 },
        allowedFilterFields: ['status', 'isConference', 'type'],
      },
    });
  }
}
