import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseBannedModule } from '../../../../common/modules/platform/banned/banned.module';
import { BannedController } from './banned.controller';
import { GetBannedUsersService } from './services/get-banned-users.service';
import { GetUsersWhoBannedMeService } from './services/get-users-who-banned-me.service';
import { ToggleBanService } from './services/toggle-ban.service';
import { AssertNotBannedService } from './services/assert-not-banned.service';

@Module({
  imports: [BaseAuthModule, BaseBannedModule],
  controllers: [BannedController],
  providers: [
    GetBannedUsersService,
    GetUsersWhoBannedMeService,
    ToggleBanService,
    AssertNotBannedService,
  ],
  exports: [
    GetBannedUsersService,
    GetUsersWhoBannedMeService,
    ToggleBanService,
    AssertNotBannedService,
  ],
})
export class BannedModule {}
