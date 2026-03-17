import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';

@Processor('mail-queue')
export class MailProcessor {
  @Process('send-email')
  async handle(job: Job) {
    const { to, subject, body } = job.data;
    console.log(`📧 إيميل إلى ${to}: ${subject}`);
    // استخدم mailService
  }
}
