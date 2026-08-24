import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';

// Extend Dayjs with isoWeek plugin
dayjs.extend(isoWeek);

export type ActivityRange = '7d' | '30d';

@Injectable()
export class GetPlatformActivityService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  public async get({ range }: { range: ActivityRange }) {
    if (range === '30d') return this.getWeeklyBuckets();
    return this.getDailyBuckets();
  }

  private async getDailyBuckets() {
    const start = dayjs().subtract(6, 'day').startOf('day').toDate();

    const result = await this.messagesRepository.aggregate({
      pipeline: [
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            messages: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ],
    });

    const map = new Map(result.map((r: any) => [r._id, r.messages]));
    const days = Array.from({ length: 7 }).map((_, i) => {
      const date = dayjs().subtract(6 - i, 'day');
      const key = date.format('YYYY-MM-DD');
      return { day: date.format('ddd'), messages: map.get(key) ?? 0 };
    });

    return days;
  }

  private async getWeeklyBuckets() {
    const start = dayjs().subtract(4, 'week').startOf('week').toDate();

    const result = await this.messagesRepository.aggregate({
      pipeline: [
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $isoWeek: '$createdAt' },
            messages: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ],
    });

    const map = new Map(result.map((r: any) => [r._id, r.messages]));

    const weeks = Array.from({ length: 4 }).map((_, i) => {
      const weekNumber = dayjs()
        .subtract(3 - i, 'week')
        .isoWeek();
      return {
        day: `Week ${i + 1}`,
        messages: map.get(weekNumber) ?? 0,
      };
    });

    return weeks;
  }
}
