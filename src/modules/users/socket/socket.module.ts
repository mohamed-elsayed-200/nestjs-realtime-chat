import { Module, Global } from '@nestjs/common';
import { MessagesGateway } from './gateways/messages-gateway/messages.gateway';
import { SpacesGateway } from './gateways/spaces-gateway/spaces.gateway';
import { PresenceGateway } from './gateways/presence-gateway/presence.gateway';
import { SocketEmitterService } from './services/socket-emitter.service';
import { SocketServerRegistry } from './services/socket-server.registry';
import { MessagesModule } from '../platform/messages/messages.module';
import { SpacesModule } from '../platform/spaces/spaces.module';
import { MembersModule } from '../platform/members/members.module';
import { BaseAuthModule } from '../../../common/modules/auth/auth.module';
import { BaseMemberModule } from '../../../common/modules/platform/members/members.module';
import { ReactionsModule } from '../platform/reactions/reactions.module';
import { MembersGateway } from './gateways/members-gateway/members.gateway';
import { ViewsGateway } from './gateways/views-gateway/views.gateway';
import { ViewsModule } from '../platform/views/views.module';
import { CallsModule } from '../platform/calls/calls.module';
import { CallsGateway } from './gateways/calls-gateway/calls.gateway';
import { CallMessagesGateway } from './gateways/calls-gateway/call-messages.gateway';

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
    PresenceGateway,
    MessagesGateway,
    SpacesGateway,
    MembersGateway,
    ViewsGateway,
    CallsGateway,
    CallMessagesGateway,
  ],
  exports: [SocketEmitterService],
})
export class SocketModule {}
