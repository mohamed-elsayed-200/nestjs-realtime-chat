import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class SpacesGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (client) => {
      console.log('🟢 Connected:', client.id);

      client.on('disconnect', () => {
        console.log('🔴 Disconnected:', client.id);
      });
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`👤 Client ${client.id} joined space_${roomId}`);
    client.join(`space_${roomId}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`space_${roomId}`);
    console.log(`👤 Client ${client.id} left space_${roomId}`);
  }

  @SubscribeMessage('send-message')
  handleSendMessage(@MessageBody() data: any) {
    const room = `space_${data.roomId || data.space}`;
    this.server.to(room).emit('sended-message', data);
    console.log('📨 Message sent to', room);
  }

  @SubscribeMessage('delete-message')
  handleDeleteMessage(
    @MessageBody()
    payload: string | { messageId: string; roomId?: string; space?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (typeof payload === 'string') {
      const data = { messageId: payload };
      client.rooms.forEach((room) => {
        if (room !== client.id) {
          this.server.to(room).emit('deleted-message', data);
        }
      });
    } else {
      const room = `space_${payload.roomId || payload.space}`;
      this.server.to(room).emit('deleted-message', {
        messageId: payload.messageId,
      });
    }
    console.log('🗑️ Message deleted');
  }

  @SubscribeMessage('react-message')
  handleReactMessage(@MessageBody() data: any) {
    const room = `space_${data.roomId || data.space}`;
    this.server.to(room).emit('reacted-message', data);
    console.log('😊 Reaction sent to', room);
  }

  @SubscribeMessage('seen-message')
  handleSeenMessage(
    @MessageBody()
    payload: string | { messageId: string; roomId?: string; space?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (typeof payload === 'string') {
      const data = { messageId: payload };
      client.rooms.forEach((room) => {
        if (room !== client.id) {
          this.server.to(room).emit('seened-message', data);
        }
      });
    } else {
      const room = `space_${payload.roomId || payload.space}`;
      this.server.to(room).emit('seened-message', {
        messageId: payload.messageId,
      });
    }
    console.log('👁️ Message seen');
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: any) {
    const room = `space_${data.space}`;
    this.server.to(room).emit('typing', data);
    console.log('⌨️ Typing in', room);
  }
}
