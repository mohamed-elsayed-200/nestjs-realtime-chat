import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';

@Injectable()
export class GetUsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
  public async get({ query }) {
    return this.usersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'email'],
        allowedFilterFields: ['status', 'type', 'role', 'permissions'],
        pipelines: [
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'getCreatedBy',
            },
          },
          {
            $unwind: {
              path: '$getCreatedBy',
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
              createdBy: {
                id: '$getCreatedBy._id',
                name: '$getCreatedBy.name',
                username: '$getCreatedBy.username',
                email: '$getCreatedBy.email',
                avatar: '$getCreatedBy.avatar',
              },
            },
          },
        ],
      },
    });
  }
}
