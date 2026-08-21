import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_TYPE_KEY } from '../decorators/user-type.decorator';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<string[]>(
      USER_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTypes) return true;

    const req = context.switchToHttp().getRequest();
    const userType = req?.user?.userType;

    if (!requiredTypes.includes(userType)) {
      throw new UnauthorizedException('auth.noPermissions');
    }

    return true;
  }
}
