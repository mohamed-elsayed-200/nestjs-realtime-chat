import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

export function createWsAuthMiddleware(jwtService: JwtService) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Unauthorized: no token provided'));
      }

      const payload = await jwtService.verifyAsync(token);
      const userId = payload?.sub ?? payload?._id ?? payload?.id;

      if (!userId) {
        return next(new Error('Unauthorized: invalid token payload'));
      }

      socket.data.userId = userId.toString();

      next();
    } catch (err: any) {
      next(new Error(`Unauthorized: ${err?.message}`));
    }
  };
}
