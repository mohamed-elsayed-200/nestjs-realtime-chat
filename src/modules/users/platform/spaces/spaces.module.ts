import { Module } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { SpacesGateway } from './spaces.gateway';

@Module({
  imports: [BaseSpaceModule, BaseAuthModule],
  controllers: [SpacesController],
  providers: [SpacesService, SpacesGateway],
  exports: [SpacesService, SpacesGateway],
})
export class SpacesModule {}
