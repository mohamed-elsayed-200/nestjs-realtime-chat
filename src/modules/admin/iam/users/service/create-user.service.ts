import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { Types } from 'mongoose';
@Injectable()
export class CreateUserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async create({ dto, authAdminId }) {
    await this.validation({ dto });
    const newUser = await this.usersRepository.createOne({
      dto: { ...dto, createdBy: new Types.ObjectId(authAdminId) },
    });
    if (!newUser) throw new NotFoundException('users.failedCreate');
    return newUser;
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
