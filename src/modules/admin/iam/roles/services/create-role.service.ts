import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RolesRepository } from '../../../../../common/modules/iam/roles/roles.repository';

@Injectable()
export class CreateRoleService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  public async create({ dto }) {
    const role = await this.rolesRepository.createOne({ dto });
    if (!role) throw new InternalServerErrorException('roles.notCreated');
    return role;
  }
}
