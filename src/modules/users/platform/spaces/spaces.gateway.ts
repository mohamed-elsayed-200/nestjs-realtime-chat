import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SpacesService } from './spaces.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SpacesGateway implements OnModuleInit {
  constructor(private spacesService: SpacesService) {}

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    return this.server.on('connection', (client) => {
      console.log(client?.id);
    });
  }

  @SubscribeMessage('space:join')
  joinSpace(@MessageBody() spaceId: string, @ConnectedSocket() client: Socket) {
    client.join(`space_${spaceId}`);
  }

  @SubscribeMessage('space:message')
  async handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`space_${data.spaceId}`).emit('space:new-message', 'Hello');
  }
}
