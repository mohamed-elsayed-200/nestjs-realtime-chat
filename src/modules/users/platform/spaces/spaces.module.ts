import { Module } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { SpacesGateway } from './spaces.gateway';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';

@Module({
  imports: [BaseSpaceModule, BaseMemberModule, BaseAuthModule],
  controllers: [SpacesController],
  providers: [SpacesService, SpacesGateway],
  exports: [SpacesService, SpacesGateway],
})
export class SpacesModule {}
