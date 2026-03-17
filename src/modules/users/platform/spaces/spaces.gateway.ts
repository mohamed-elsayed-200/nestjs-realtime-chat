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
  cors: {
    origin: '*',
  },
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
    client.join(`space_${roomId}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`space_${roomId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: any) {
    this.server.to(`space_${data.chatId}`).emit('typing', data);
  }
}
