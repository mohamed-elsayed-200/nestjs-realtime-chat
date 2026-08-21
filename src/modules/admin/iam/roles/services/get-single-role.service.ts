import { Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from '../../../../../common/modules/iam/roles/roles.repository';

@Injectable()
export class GetSingleRolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  public async get({ roleId }) {
    const role = await this.rolesRepository.findOne({
      query: { _id: roleId },
    });
    if (!role) throw new NotFoundException('roles.notFound');
    return role;
  }
}
