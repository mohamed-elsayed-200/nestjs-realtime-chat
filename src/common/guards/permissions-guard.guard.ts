import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UsersRepository } from '../modules/iam/users/users.repository';
import { UserType } from '../types/enums';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const userId = request?.user?._id;
    const userType: UserType = request?.user?.userType;

    if (!userId) throw new UnauthorizedException('auth.noPermissions');

    if (userType === UserType.ADMIN) {
      return true;
    }

    // Nothing required for this route → skip the DB round-trip entirely
    if (!requiredPermissions?.length) {
      return true;
    }

    const user = await this.usersRepository.findOne({
      query: { _id: userId },
      populate: [{ path: 'roles' }], // permissions is a plain string[] on Role, no nested populate needed
    });

    if (!user) throw new UnauthorizedException('auth.userNotFound');

    const userPermissions: string[] =
      user.roles?.flatMap((r: any) => r?.permissions ?? []) ?? [];

    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('auth.noPermissions');
    }

    return true;
  }
}
