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

  // 🔥 إرسال لمستخدم معين (جميع الـ sessions بتاعته)
  emitToUser(userId: string, event: SocketEvents, payload: unknown) {
    const room = RoomNames.user(userId);
    this.server.to(room).emit(event, payload);
  }

  // 🔥 إرسال لـ session معين فقط
  emitToSession(sessionKey: string, event: SocketEvents, payload: unknown) {
    const room = RoomNames.session(sessionKey);
    this.server.to(room).emit(event, payload);
  }

  // 🔥 إرسال لـ space معين
  emitToSpace(spaceId: string, event: SocketEvents, payload: unknown) {
    const room = RoomNames.space(spaceId);
    this.server.to(room).emit(event, payload);
  }

  // 🔥 إرسال لـ community معين
  emitToCommunity(communityId: string, event: SocketEvents, payload: unknown) {
    const room = RoomNames.community(communityId);
    this.server.to(room).emit(event, payload);
  }

  // 🔥 إرسال للكل
  emitToAll(event: SocketEvents, payload: unknown) {
    this.server.emit(event, payload);
  }
}
