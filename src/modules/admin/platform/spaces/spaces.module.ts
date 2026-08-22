import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { GetSpacesService } from './services/get-spaces.service';

@Module({
  imports: [BaseSpaceModule, BaseAuthModule],
  controllers: [SpacesController],
  providers: [GetSpacesService],
})
export class SpacesModule {}
