import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { Types } from 'mongoose';

@Injectable()
export class UpdateUserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async update({ dto, userId }) {
    await this.validation({ dto, userId });
    const user = await this.usersRepository.updateOne({
      query: { _id: new Types.ObjectId(userId) },
      dto,
    });
    if (!user) throw new NotFoundException('users.failedUpdate');
    return user;
  }

  private async validation({ dto, userId }) {
    const userObjectId = new Types.ObjectId(userId);

    if (dto?.email) {
      const existingUser = await this.usersRepository.findOne({
        query: {
          email: dto?.email,
        },
      });

      if (existingUser && existingUser._id.toString() !== userId) {
        throw new ConflictException('users.alreadyExist');
      }
    }

    if (dto?.username) {
      const existingUser = await this.usersRepository.findOne({
        query: {
          username: dto?.username,
        },
      });

      if (existingUser && existingUser._id.toString() !== userId) {
        throw new ConflictException('users.alreadyExist');
      }
    }
  }
}
