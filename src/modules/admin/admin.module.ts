import { Module } from '@nestjs/common';
import { SessionsModule } from './iam/sessions/sessions.module';
import { RolesModule } from './iam/roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { UsersModule } from './iam/users/users.module';
import { MessagingModule } from './platform/messaging/messaging.module';
import { SpacesModule } from './platform/spaces/spaces.module';
import { CallsModule } from './platform/calls/calls.module';
import { ContentReportsModule } from './platform/reports/content/content-reports.module';
import { SystemIssuesModule } from './platform/reports/issues/system-issues.module';
import { OverviewModule } from './platform/overview/overview.module';

@Module({
  imports: [
    AuthModule,
    AccountModule,
    RolesModule,
    SessionsModule,
    UsersModule,
    MessagingModule,
    SpacesModule,
    CallsModule,
    ContentReportsModule,
    SystemIssuesModule,
    OverviewModule,
  ],
})
export class AdminModule {}
