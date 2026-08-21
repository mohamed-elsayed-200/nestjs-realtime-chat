import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseRolesModule } from '../../../../common/modules/iam/roles/roles.module';
import { SessionsController } from './sessions.controller';
import { GetSessionsService } from './services/get-sessions.service';
import { GetSingleSessionService } from 'src/modules/users/platform/sessions/services/get-single-session.service';
import { ActiveSessionService } from './services/active-session.service';
import { InactiveSessionService } from './services/inactive-session.service';
import { DeleteSessionService } from './services/delete-session.service';

@Module({
  imports: [BaseRolesModule, BaseAuthModule],
  controllers: [SessionsController],
  providers: [
    GetSessionsService,
    GetSingleSessionService,
    ActiveSessionService,
    InactiveSessionService,
    DeleteSessionService,
  ],
  exports: [
    GetSessionsService,
    GetSingleSessionService,
    ActiveSessionService,
    InactiveSessionService,
    DeleteSessionService,
  ],
})
export class SessionsModule {}
