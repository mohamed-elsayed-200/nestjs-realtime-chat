import { AccountService } from './account.service';
import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { BaseAuthModule } from '../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../common/modules/platform/spaces/spaces.module';

@Module({
  imports: [BaseAuthModule, BaseSpaceModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
