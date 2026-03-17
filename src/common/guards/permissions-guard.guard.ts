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
    const userId: any = request?.user?._id;
    const userType: UserType = request?.user.userType;
    if (!userId) throw new UnauthorizedException('auth.noPermissions');

    if (userType === UserType.ADMIN) {
      return true;
    }

    const user: any = await this.usersRepository.findOne({
      query: { _id: userId },
      populate: [
        {
          path: 'roles',
          populate: {
            path: 'permissions',
            model: 'Permission',
          },
        },
      ],
    });

    if (!user) throw new UnauthorizedException('auth.userNotFound');

    const userPermissions =
      user.roles?.flatMap((r) => r?.permissions?.map((p) => p.code)) || [];

    if (requiredPermissions?.length) {
      const hasAllPermissions = requiredPermissions.every((perm) =>
        userPermissions.includes(perm),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException('auth.noPermissions');
      }
    }

    return true;
  }
}
