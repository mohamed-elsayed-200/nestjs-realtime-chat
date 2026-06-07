import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { SessionsRepository } from '../modules/iam/sessions/sessions.repository';
import { UsersRepository } from '../modules/iam/users/users.repository';
import { extractToken } from '../utils/extract-token';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionsRepository: SessionsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = extractToken(request);

    if (!token) {
      throw new UnauthorizedException('auth.invalidToken');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const session = await this.sessionsRepository.validateSession({
        sessionId: payload.sessionId,
        userId: payload.userId,
      });

      if (!session) {
        throw new UnauthorizedException('auth.sessionNotFound');
      }

      const user = await this.usersRepository.findOne({
        query: { _id: payload.userId },
        select: 'userType name avatar username profileColor',
      });

      if (!user) throw new UnauthorizedException('auth.userNotFound');

      request['sessionId'] = session?._id;
      request['user'] = user;
    } catch (error) {
      console.log('error auth', error);
      throw new UnauthorizedException('auth.expireToken');
    }

    return true;
  }
}
