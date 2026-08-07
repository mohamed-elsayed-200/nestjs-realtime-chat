import { Module, Global } from '@nestjs/common';
import { MessagesGateway } from './gateways/messages-gateway/messages.gateway';
import { SpacesGateway } from './gateways/spaces-gateway/spaces.gateway';
import { PresenceGateway } from './gateways/presence-gateway/presence.gateway';
import { SocketEmitterService } from './services/socket-emitter.service';
import { SocketServerRegistry } from './services/socket-server.registry';
import { MessagesModule } from '../users/platform/messages/messages.module';
import { SpacesModule } from '../users/platform/spaces/spaces.module';
import { MembersModule } from '../users/platform/members/members.module';
import { BaseAuthModule } from '../../common/modules/auth/auth.module';
import { BaseMemberModule } from '../../common/modules/platform/members/members.module';
import { ReactionsModule } from '../users/platform/reactions/reactions.module';
import { MembersGateway } from './gateways/members-gateway/members.gateway';
import { ViewsGateway } from './gateways/views-gateway/views.gateway';
import { ViewsModule } from '../users/platform/views/views.module';
import { CallsModule } from '../users/platform/calls/calls.module';

@Module({
  imports: [
    BaseAuthModule,
    BaseMemberModule,
    MembersModule,
    CallsModule,
    MessagesModule,
    SpacesModule,
    ReactionsModule,
    ViewsModule,
  ],
  providers: [
    SocketServerRegistry,
    SocketEmitterService,
    MessagesGateway,
    SpacesGateway,
    PresenceGateway,
    MembersGateway,
    ViewsGateway,
  ],
  exports: [SocketEmitterService],
})
export class SocketModule {}
