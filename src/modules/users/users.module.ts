import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { MessagesModule } from './platform/messages/messages.module';
import { MembersModule } from './platform/members/members.module';
import { ReactionsModule } from './platform/reactions/reactions.module';
import { SpacesModule } from './platform/spaces/spaces.module';
import { ContactsModule } from './platform/contacts/contacts.module';
import { PeoplesModule } from './platform/peoples/peoples.module';
import { FoldersModule } from './platform/folders/folders.module';
import { JoinRequestsModule } from './platform/join-requests/join-requests.module';
import { CommentsModule } from './platform/comments/comments.module';
import { ViewsModule } from './platform/views/views.module';
import { CallsModule } from './platform/calls/calls.module';
import { BannedModule } from './platform/banned/banned.module';
import { SessionsModule } from './platform/sessions/sessions.module';

@Module({
  imports: [
    AuthModule,
    AccountModule,
    MessagesModule,
    MembersModule,
    ReactionsModule,
    SpacesModule,
    ContactsModule,
    PeoplesModule,
    FoldersModule,
    JoinRequestsModule,
    CommentsModule,
    ViewsModule,
    CallsModule,
    BannedModule,
    SessionsModule,
  ],
})
export class UsersModule {}
