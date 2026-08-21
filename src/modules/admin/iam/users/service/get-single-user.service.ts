import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { Types } from 'mongoose';
@Injectable()
export class GetSingleUserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async get({ userId }) {
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
}
