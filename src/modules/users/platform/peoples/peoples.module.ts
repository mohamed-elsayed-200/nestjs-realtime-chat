import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { PeoplesController } from './peoples.controller';
import { PeoplesService } from './peoples.service';

@Module({
  imports: [BaseAuthModule],
  controllers: [PeoplesController],
  providers: [PeoplesService],
})
export class PeoplesModule {}
