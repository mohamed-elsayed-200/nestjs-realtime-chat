import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { Types } from 'mongoose';

@Injectable()
export class UpdateUserService {
  constructor(private readonly usersRepository: UsersRepository) {}
  public async update({ dto, userId }) {
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
