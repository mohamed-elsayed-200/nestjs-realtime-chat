import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';

@Module({
  imports: [BaseMemberModule, BaseAuthModule, BaseSpaceModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
