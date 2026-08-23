// get-calls-stats.service.ts
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { CallStatus } from '../../../../../common/types/enums';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';

const ONGOING_STATUSES = [
  CallStatus.INITIATED,
  CallStatus.RINGING,
  CallStatus.IN_PROGRESS,
];

@Injectable()
export class GetCallsStatsService {
  constructor(private readonly callsRepository: CallsRepository) {}

  async get() {
    const startOfDay = dayjs().startOf('day').toDate();

    const activeCalls = await this.callsRepository.count({
      query: { status: { $in: ONGOING_STATUSES } },
    });

    const callsToday = await this.callsRepository.count({
      query: { createdAt: { $gte: startOfDay } },
    });

    // Average duration (in seconds) for calls that completed today
    const avgDurationResult = await this.callsRepository.aggregate({
      pipeline: [
        {
          $match: {
            status: CallStatus.COMPLETED,
            endedAt: { $gte: startOfDay },
            duration: { $exists: true, $ne: null },
          },
        },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
      ],
    });

    const avgDurationSeconds = Math.round(
      avgDurationResult[0]?.avgDuration ?? 0,
    );

    return {
      activeCalls,
      callsToday,
      avgDuration: this.formatDuration(avgDurationSeconds),
    };
  }

  private formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
