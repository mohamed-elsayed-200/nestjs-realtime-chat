import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseRolesModule } from '../../../../common/modules/iam/roles/roles.module';
import { SessionsController } from './sessions.controller';
import { GetSessionsService } from './services/get-sessions.service';
import { GetSingleSessionService } from './services/get-single-session.service';
import { ActiveSessionService } from './services/active-session.service';
import { InactiveSessionService } from './services/inactive-session.service';

@Module({
  imports: [BaseRolesModule, BaseAuthModule],
  controllers: [SessionsController],
  providers: [
    GetSessionsService,
    GetSingleSessionService,
    ActiveSessionService,
    InactiveSessionService,
  ],
  exports: [
    GetSessionsService,
    GetSingleSessionService,
    ActiveSessionService,
    InactiveSessionService,
  ],
})
export class SessionsModule {}
