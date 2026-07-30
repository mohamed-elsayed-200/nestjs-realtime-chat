import { Module, Global } from '@nestjs/common';
import { MessagesGateway } from './gateways/messages-gateway/messages.gateway';
import { SpacesGateway } from './gateways/spaces.gateway';
import { PresenceGateway } from './gateways/presence.gateway/presence.gateway';
import { SocketEmitterService } from './services/socket-emitter.service';
import { SocketServerRegistry } from './services/socket-server.registry';
import { MessagesModule } from '../users/platform/messages/messages.module';
import { SpacesModule } from '../users/platform/spaces/spaces.module';
import { MembersModule } from '../users/platform/members/members.module';
import { BaseAuthModule } from '../../common/modules/auth/auth.module';
import { BaseMemberModule } from '../../common/modules/platform/members/members.module';

@Global()
@Module({
  imports: [
    BaseMemberModule,
    MembersModule,
    MessagesModule,
    SpacesModule,
    BaseAuthModule,
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
