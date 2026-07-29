import { Injectable } from '@nestjs/common';
import { SocketServerRegistry } from './socket-server.registry';
import { RoomNames } from 'src/common/utils/room-names';
import { SocketEvents } from 'src/common/types/enums';

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

  emitToCommunity(communityId: string, event: SocketEvents, payload: unknown) {
    this.server.to(RoomNames.community(communityId)).emit(event, payload);
  }

  emitChannelInfoUpdated(spaceId: string, payload: unknown) {
    this.emitToSpace(spaceId, SocketEvents.CHANNEL_INFO_UPDATED, payload);
  }

  emitGroupInfoUpdated(spaceId: string, payload: unknown) {
    this.emitToSpace(spaceId, SocketEvents.GROUP_INFO_UPDATED, payload);
  }

  emitCommunityInfoUpdated(communityId: string, payload: unknown) {
    this.emitToCommunity(
      communityId,
      SocketEvents.COMMUNITY_INFO_UPDATED,
      payload,
    );
  }

  emitCommunitySpaceAdded(communityId: string, payload: unknown) {
    this.emitToCommunity(
      communityId,
      SocketEvents.COMMUNITY_SPACE_ADDED,
      payload,
    );
  }
}
