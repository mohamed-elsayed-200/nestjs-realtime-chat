import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';
import { SpaceTypes, UserType } from '../../../../common/types/enums';

@Injectable()
export class PeoplesService {
  constructor(private readonly usersRepository: UsersRepository) {}
  public async getAll({ query, authUser }) {
    const userId = new Types.ObjectId(authUser?._id);
    return this.usersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['username'],
        pipelines: [
          {
            $match: {
              userType: UserType.USER,
              _id: { $ne: userId },
            },
          },
          {
            $lookup: {
              from: 'contacts',
              let: { peopleId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$me', userId] },
                        { $eq: ['$contact', '$$peopleId'] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: 'contact',
            },
          },
          {
            $unwind: {
              path: '$contact',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'spaces',
              let: { peopleId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$type', SpaceTypes.PRIVATE] },
                        {
                          $or: [
                            {
                              $and: [
                                { $eq: ['$sender._id', userId] },
                                { $eq: ['$received._id', '$$peopleId'] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ['$sender._id', '$$peopleId'] },
                                { $eq: ['$received._id', userId] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: 'existingSpace',
            },
          },
          {
            $match: {
              existingSpace: { $size: 0 },
            },
          },
          {
            $project: {
              _id: 1,
              email: 1,
              username: 1,
              avatar: 1,
              status: 1,
              profileColor: 1,
              name: {
                $ifNull: ['$contact.name', '$name'],
              },
              isContact: {
                $ifNull: [{ $toBool: '$contact._id' }, false],
              },
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
