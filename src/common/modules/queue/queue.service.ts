import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('notification-queue') private notificationQueue: Queue,
    @InjectQueue('mail-queue') private mailQueue: Queue,
    @InjectQueue('webhook-queue') private webhookQueue: Queue,
  ) {}

  async addNotificationJob(data: any) {
    await this.notificationQueue.add('send-notification', data);
  }

  async addMailJob(data: any) {
    await this.mailQueue.add('send-email', data);
  }

  async addWebhookJob(data: any) {
    await this.webhookQueue.add('send-webhook', data);
  }
}
