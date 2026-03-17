import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';
import { Types } from 'mongoose';
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
  public async getAll({ query }) {
    return this.usersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'email'],
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

  public async getOne({ userId }) {
    const user = await this.usersRepository.findOne({
      query: { _id: userId },
      select: '+email',
      populate: [
        {
          path: 'createdBy',
          model: 'User',
          select: 'name email username avatar',
        },
      ],
    });
    if (!user) throw new NotFoundException('users.notFound');
    return user;
  }

  public async createUser({ dto, authAdminId }) {
    await this.validation({ dto });
    const newUser = await this.usersRepository.createOne({
      dto: { ...dto, createdBy: new Types.ObjectId(authAdminId) },
    });
    if (!newUser) throw new NotFoundException('users.failedCreate');
    return newUser;
  }

  public async updateUser({ dto, userId }) {
    await this.validation({ dto });
    const user = await this.usersRepository.updateOne({
      query: { _id: userId },
      dto,
    });
    if (!user) throw new NotFoundException('users.failedUpdate');
    return user;
  }

  private async validation({ dto }) {
    if (dto?.email) {
      const isExist = await this.usersRepository.findOne({
        query: {
          email: dto?.email,
        },
      });
      if (isExist) throw new NotFoundException('users.alreadyExist');
    }
    if (dto?.username) {
      const isExist = await this.usersRepository.findOne({
        query: {
          username: dto?.username,
        },
      });
      if (isExist) throw new NotFoundException('users.alreadyExist');
    }
  }
}
