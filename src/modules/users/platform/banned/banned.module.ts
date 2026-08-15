import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseBannedModule } from '../../../../common/modules/platform/banned/banned.module';
import { BannedController } from './banned.controller';
import { BannedService } from './banned.service';

@Module({
  imports: [BaseAuthModule, BaseBannedModule],
  controllers: [BannedController],
  providers: [BannedService],
  exports: [BannedService],
})
export class BannedModule {}
