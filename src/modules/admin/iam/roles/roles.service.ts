import { Permission } from './../../../../common/modules/iam/permissions/permission.schema';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RolesRepository } from '../../../../common/modules/iam/roles/roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}
  public async getAll({ query }) {
    return this.rolesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name'],
        pipelines: [
          {
            $lookup: {
              from: 'permissions',
              localField: 'permissions',
              foreignField: '_id',
              as: 'getPermissions',
            },
          },
          {
            $unwind: {
              path: '$getPermissions',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              username: 1,
              avatar: 1,
              status: 1,
              userType: 1,
              roles: 1,
              accountBalance: 1,
              is2FA: 1,
              lastLoginAt: 1,
              lastPasswordChangedAt: 1,
              lastIp: 1,
              createdAt: 1,
              permissions: '$getPermissions',
            },
          },
        ],
      },
    });
  }

  public async getOne({ roleId }) {
    const role = await this.rolesRepository.findOne({
      query: { _id: roleId },
      populate: [
        {
          path: 'permissions',
          select: 'code bio',
        },
      ],
    });
    if (!role) throw new NotFoundException('roles.notFound');
    return role;
  }

  public async create({ dto }) {
    const role = await this.rolesRepository.createOne({ dto });
    if (!role) throw new InternalServerErrorException('roles.notCreated');
    return role;
  }

  public async update({ roleId, dto }) {
    const role = await this.rolesRepository.updateOne({
      query: { _id: roleId },
      dto,
    });
    if (!role) throw new NotFoundException('roles.notUpdated');
    return role;
  }

  public async delete({ roleId }) {
    const role = await this.rolesRepository.deleteOne({
      query: { _id: roleId },
    });
    if (!role) throw new NotFoundException('roles.notDeleted');
    return role;
  }
}
