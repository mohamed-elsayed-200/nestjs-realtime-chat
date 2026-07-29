import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { createWsAuthMiddleware } from '../../../common/middleware/ws-auth.middleware';

export class SocketIoAdapter extends IoAdapter {
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        credentials: true,
      },
    });

    const jwtService = this.app.get(JwtService);
    server.use(createWsAuthMiddleware(jwtService));

    return server;
  }
}
