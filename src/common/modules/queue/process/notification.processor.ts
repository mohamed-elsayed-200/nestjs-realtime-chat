import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';

@Processor('notification-queue')
export class NotificationProcessor {
  @Process('send-notification')
  async handle(job: Job) {
    const { userId, title, message } = job.data;
    console.log(`🔔 إشعار: ${userId} - ${title}`);
    // احفظ في جدول notifications
  }
}
