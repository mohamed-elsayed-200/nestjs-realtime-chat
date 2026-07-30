import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createWsAuthMiddleware } from '../../../common/middleware/ws-auth.middleware';
import { SessionsRepository } from '../../../common/modules/iam/sessions/sessions.repository';
import { UsersRepository } from '../../../common/modules/iam/users/users.repository';

export class SocketIoAdapter extends IoAdapter {
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: '*', credentials: true },
    });

    const jwtService = this.app.get(JwtService);
    const configService = this.app.get(ConfigService);
    const sessionsRepository = this.app.get(SessionsRepository);
    const usersRepository = this.app.get(UsersRepository);

    server.use(
      createWsAuthMiddleware(
        jwtService,
        configService,
        sessionsRepository,
        usersRepository,
      ),
    );

    return server;
  }
}
