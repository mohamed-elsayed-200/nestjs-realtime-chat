import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PermissionsRepository } from '../../../../common/modules/iam/permissions/permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}
  public async getAll({ query }) {
    return this.permissionsRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['code', 'description'],
      },
    });
  }

  public async getOne({ permissionId }) {
    const permission = await this.permissionsRepository.findOne({
      query: { _id: permissionId },
    });
    if (!permission) throw new NotFoundException('permissions.notFound');
    return permission;
  }
}
