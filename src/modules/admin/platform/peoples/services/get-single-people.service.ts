import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';

@Injectable()
export class GetSinglePeopleService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async get({ peopleIdOrUsername }) {
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
