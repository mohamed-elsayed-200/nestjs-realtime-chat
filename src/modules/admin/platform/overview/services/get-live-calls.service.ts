import { Injectable } from '@nestjs/common';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { CallStatus } from '../../../../../common/types/enums';

@Injectable()
export class GetLiveCallsService {
  constructor(private readonly callsRepository: CallsRepository) {}

  public async get({ limit = 5 }: { limit?: number }) {
    const result = await this.callsRepository.aggregate({
      pipeline: [
        { $match: { status: CallStatus.IN_PROGRESS } },
        { $sort: { startedAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'caller',
            foreignField: '_id',
            as: 'callerDoc',
          },
        },
        { $unwind: { path: '$callerDoc', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'spaces',
            localField: 'space',
            foreignField: '_id',
            as: 'spaceDoc',
          },
        },
        { $unwind: { path: '$spaceDoc', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            type: 1,
            isConference: 1,
            participantsCount: 1,
            startedAt: 1,
            callerName: { $ifNull: ['$callerDoc.name', 'Unknown'] },
            spaceName: { $ifNull: ['$spaceDoc.name', null] },
          },
        },
      ],
    });

    return result.map((call: any) => ({
      id: call._id,
      label: call.isConference ? 'Meeting' : 'Call',
      spaceName: call.spaceName,
      participants:
        call.participantsCount > 1
          ? `${call.callerName} + ${call.participantsCount - 1} participants`
          : call.callerName,
    }));
  }
}
