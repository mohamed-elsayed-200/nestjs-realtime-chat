import { Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from '../../../../../common/modules/iam/roles/roles.repository';

@Injectable()
export class DeleteRoleService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  public async delete({ roleId }) {
    const role = await this.rolesRepository.deleteOne({
      query: { _id: roleId },
    });
    if (!role) throw new NotFoundException('roles.notDeleted');
    return role;
  }
}
