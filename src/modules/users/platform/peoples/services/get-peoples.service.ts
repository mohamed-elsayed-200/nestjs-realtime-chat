import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { SpaceTypes, UserType } from '../../../../../common/types/enums';

@Injectable()
export class GetPeoplesService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async get({ queryPeoples, authUser }) {
    const { excludeExistingSpaces, ...query } = queryPeoples;
    const userId = new Types.ObjectId(authUser?._id);

    const pipeline: any[] = [
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
    ];

    if (excludeExistingSpaces === 'yes') {
      pipeline.push(
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
                              { $eq: ['$sender', userId] },
                              { $eq: ['$received', '$$peopleId'] },
                            ],
                          },
                          {
                            $and: [
                              { $eq: ['$sender', '$$peopleId'] },
                              { $eq: ['$received', userId] },
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
      );
    }

    pipeline.push({
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
    });

    return this.usersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'username'],
        pipelines: pipeline,
      },
    });
  }
}
