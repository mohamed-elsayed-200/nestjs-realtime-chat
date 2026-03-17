import { Module } from '@nestjs/common';
import { UploadsRepository } from './uploads.repository';

@Module({
  providers: [UploadsRepository],
  exports: [UploadsRepository],
})
export class BaseUploadsModule {}
