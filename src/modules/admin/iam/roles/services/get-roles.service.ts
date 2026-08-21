import { Injectable } from '@nestjs/common';
import { RolesRepository } from '../../../../../common/modules/iam/roles/roles.repository';

@Injectable()
export class GetRolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  public async get({ query }) {
    return this.rolesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name'],
        pipelines: [
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
              permissions: 1,
            },
          },
        ],
      },
    });
  }
}
