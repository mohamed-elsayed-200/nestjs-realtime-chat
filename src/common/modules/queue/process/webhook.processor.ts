import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';

@Processor('webhook-queue')
export class WebhookProcessor {
  @Process('send-webhook')
  async handle(job: Job) {
    const { storeId, event, payload } = job.data;
    console.log(`🌐 Webhook: ${event} للمتجر ${storeId}`);
    // أرسل webhook عبر HTTP
  }
}
