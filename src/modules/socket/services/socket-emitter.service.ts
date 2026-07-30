import { Injectable } from '@nestjs/common';
import { SocketServerRegistry } from './socket-server.registry';
import { RoomNames } from '../../../common/utils/room-names';
import { SocketEvents } from '../../../common/types/enums';

@Injectable()
export class SocketEmitterService {
  constructor(private readonly registry: SocketServerRegistry) {}

  private get server() {
    return this.registry.getServer();
  }

  emitToUser(userId: string, event: SocketEvents, payload: unknown) {
    this.server.to(RoomNames.user(userId)).emit(event, payload);
  }

  emitToSpace(spaceId: string, event: SocketEvents, payload: unknown) {
    this.server.to(RoomNames.space(spaceId)).emit(event, payload);
  }
}
