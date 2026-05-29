import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';
import { UserType } from '../../../../common/types/enums';

@Injectable()
export class PeoplesService {
  constructor(private readonly usersRepository: UsersRepository) {}
  public async getAll({ query, authUser }) {
    return this.usersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['username'],
        pipelines: [
          {
            $match: {
              userType: UserType.USER,
              _id: { $ne: new Types.ObjectId(authUser?._id) },
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              username: 1,
              avatar: 1,
              status: 1,
              profileColor: 1,
            },
          },
        ],
      },
    });
  }
  public async getOne({ peopleIdOrUsername }) {
    const people = await this.usersRepository.findOne({
      query: {
        $or: [{ _id: peopleIdOrUsername }, { username: peopleIdOrUsername }],
      },
    });

    if (!people) throw new NotFoundException('peoples.notFound');

    return {
      name: people?.name,
      email: people?.email,
      username: people?.username,
      avatar: people?.avatar,
      status: people?.status,
      roles: people?.roles,
    };
  }
}
