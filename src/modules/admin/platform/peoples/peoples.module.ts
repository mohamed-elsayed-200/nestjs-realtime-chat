import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { PeoplesController } from './peoples.controller';
import { GetPeoplesService } from './services/get-peoples.service';
import { GetSinglePeopleService } from './services/get-single-people.service';

@Module({
  imports: [BaseAuthModule],
  controllers: [PeoplesController],
  providers: [GetPeoplesService, GetSinglePeopleService],
})
export class PeoplesModule {}
