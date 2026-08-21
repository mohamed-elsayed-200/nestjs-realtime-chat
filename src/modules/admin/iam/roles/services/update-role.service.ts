import { Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from '../../../../../common/modules/iam/roles/roles.repository';

@Injectable()
export class UpdateRolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  public async update({ roleId, dto }) {
    const role = await this.rolesRepository.updateOne({
      query: { _id: roleId },
      dto,
    });
    if (!role) throw new NotFoundException('roles.notUpdated');
    return role;
  }
}
