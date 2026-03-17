import { AccountService } from './account.service';
import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { BaseAuthModule } from '../../../common/modules/auth/auth.module';

@Module({
  imports: [BaseAuthModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
