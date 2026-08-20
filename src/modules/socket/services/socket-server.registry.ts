import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketServerRegistry {
  private server: Server | null = null;

  setServer(server: Server) {
    if (!this.server) this.server = server;
  }

  getServer(): Server {
    if (!this.server) {
      throw new Error('Socket server has not been initialized yet');
    }
    return this.server;
  }
}
