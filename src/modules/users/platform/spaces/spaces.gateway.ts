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
    @MessageBody() spaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`👤 Client ${client.id} joined space_${spaceId}`);
    client.join(`space_${spaceId}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() spaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`space_${spaceId}`);
    console.log(`👤 Client ${client.id} left space_${spaceId}`);
  }

  @SubscribeMessage('send-message')
  handleSendMessage(@MessageBody() data: any) {
    const room = `space_${data.space}`;
    this.server.to(room).emit('sended-message', data);
    console.log('📨 Message sent to', room);
  }

  @SubscribeMessage('edit-message')
  handleEditMessage(@MessageBody() data: any) {
    const room = `space_${data.space}`;
    this.server.to(room).emit('edited-message', data);
    console.log('📨 Message edited', room);
  }

  @SubscribeMessage('delete-message')
  handleDeleteMsg(@MessageBody() data: any) {
    const room = `space_${data.space}`;
    this.server.to(room).emit('deleted-message', data);
    console.log('📨 Message delete', room);
  }

  @SubscribeMessage('react-message')
  handleReactMessage(@MessageBody() data: any) {
    const room = `space_${data.space}`;
    this.server.to(room).emit('reacted-message', data);
    console.log('😊 Reaction sent to', room);
  }

  @SubscribeMessage('seen-message')
  handleSeenMessage(@MessageBody() data: any) {
    const room = `space_${data.space}`;
    this.server.to(room).emit('seened-message', data);
    console.log('👁️ Message seen', room);
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: any) {
    const room = `space_${data.space}`;
    this.server.to(room).emit('typing', data);
    console.log('⌨️ Typing in', room);
  }
}
