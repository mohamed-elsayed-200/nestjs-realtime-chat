import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { NotificationProcessor } from './process/notification.processor';
import { MailProcessor } from './process/mail.processor';
import { WebhookProcessor } from './process/webhook.processor';

const queues = ['notification-queue', 'mail-queue', 'webhook-queue'];

@Module({
  imports: [
    ConfigModule,
    ...queues.map((name) =>
      BullModule.registerQueueAsync({
        name,
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          redis: config.get('queue.redis'),
        }),
        inject: [ConfigService],
      }),
    ),
  ],
  providers: [
    QueueService,
    NotificationProcessor,
    MailProcessor,
    WebhookProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}
