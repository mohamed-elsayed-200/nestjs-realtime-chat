import { Module, Global, forwardRef } from '@nestjs/common';
import { MessagesGateway } from './gateways/messages-gateway/messages.gateway';
import { SpacesGateway } from './gateways/spaces.gateway';
import { PresenceGateway } from './gateways/presence.gateway';
import { SocketEmitterService } from './services/socket-emitter.service';
import { SocketServerRegistry } from './services/socket-server.registry';
import { MessagesModule } from '../users/platform/messages/messages.module';
import { SpacesModule } from '../users/platform/spaces/spaces.module';
import { MembersModule } from '../users/platform/members/members.module';

@Global()
@Module({
  imports: [
    forwardRef(() => MessagesModule),
    forwardRef(() => SpacesModule),
    MembersModule,
  ],
  providers: [
    SocketServerRegistry,
    SocketEmitterService,
    MessagesGateway,
    SpacesGateway,
    PresenceGateway,
  ],
  exports: [SocketEmitterService],
})
export class SocketModule {}
