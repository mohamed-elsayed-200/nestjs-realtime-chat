// ws-auth.middleware.ts
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionsRepository } from '../modules/iam/sessions/sessions.repository';
import { UsersRepository } from '../modules/iam/users/users.repository';

export function createWsAuthMiddleware(
  jwtService: JwtService,
  configService: ConfigService,
  sessionsRepository: SessionsRepository,
  usersRepository: UsersRepository,
) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Unauthorized: no token provided'));
      }

      const payload = await jwtService.verifyAsync(token, {
        secret: configService.get<string>('JWT_SECRET'),
      });

      const userId = payload?.userId;

      if (!userId) {
        return next(new Error('Unauthorized: invalid token payload'));
      }

      const session = await sessionsRepository.validateSession({
        sessionId: payload.sessionId,
        userId: payload.userId,
      });

      if (!session) {
        return next(new Error('Unauthorized: session not found'));
      }

      const user = await usersRepository.findOne({
        query: { _id: userId },
        select: 'userType name avatar username profileColor',
      });

      if (!user) {
        return next(new Error('Unauthorized: user not found'));
      }
      console.log('userId', userId);

      socket.data.userId = userId.toString();
      socket.data.sessionId = session._id?.toString();

      next();
    } catch (err: any) {
      next(new Error(`Unauthorized: ${err?.message}`));
    }
  };
}
