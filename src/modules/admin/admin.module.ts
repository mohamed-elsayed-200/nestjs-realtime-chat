import { Module } from '@nestjs/common';
import { SessionsModule } from './iam/sessions/sessions.module';
import { RolesModule } from './iam/roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { UsersModule } from './iam/users/users.module';

@Module({
  imports: [
    AuthModule,
    AccountModule,
    RolesModule,
    SessionsModule,
    UsersModule,
  ],
})
export class AdminModule {}
