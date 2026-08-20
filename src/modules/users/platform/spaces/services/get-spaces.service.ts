import { Types } from 'mongoose';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GetSpacesService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async get({ query, authUser }) {
    const userId = new Types.ObjectId(authUser._id);

    const spaces = await this.membersRepository.findAll({
      query: query,
      options: {
        allowedSearchFields: ['name', 'bio'],
        allowedFilterFields: ['status', 'type', 'archive'],
        pipelines: [
          {
            $match: {
              user: userId,
              isDeleted: false,
            },
          },

          {
            $lookup: {
              from: 'spaces',
              localField: 'space',
              foreignField: '_id',
              as: 'space',
            },
          },
          { $unwind: '$space' },

          {
            $match: {
              $or: [
                { 'space.parentSpace': { $exists: false } },
                { 'space.parentSpace': null },
              ],
            },
          },

          {
            $lookup: {
              from: 'users',
              let: {
                senderId: '$space.sender',
                receivedId: '$space.received',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        { $eq: ['$_id', '$$senderId'] },
                        { $eq: ['$_id', '$$receivedId'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    username: 1,
                    avatar: 1,
                    profileColor: 1,
                    bio: 1,
                  },
                },
              ],
              as: 'spaceUsers',
            },
          },

          {
            $lookup: {
              from: 'contacts',
              let: {
                spaceSender: '$space.sender',
                spaceReceived: '$space.received',
                userId: userId,
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$me', '$$userId'] },
                        {
                          $or: [
                            { $eq: ['$contact', '$$spaceReceived'] },
                            { $eq: ['$contact', '$$spaceSender'] },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    avatar: 1,
                    profileColor: 1,
                  },
                },
              ],
              as: 'userContacts',
            },
          },

          {
            $addFields: {
              myContactId: {
                $cond: {
                  if: { $eq: [userId, '$space.sender'] },
                  then: '$space.senderContact',
                  else: '$space.receivedContact',
                },
              },
            },
          },
          {
            $lookup: {
              from: 'contacts',
              let: {
                myContactId: '$myContactId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$myContactId'] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    avatar: 1,
                    profileColor: 1,
                  },
                },
              ],
              as: 'spaceContacts',
            },
          },

          {
            $addFields: {
              otherParty: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$spaceUsers',
                      as: 'user',
                      cond: {
                        $ne: ['$$user._id', userId],
                      },
                    },
                  },
                  0,
                ],
              },
              userContact: { $arrayElemAt: ['$userContacts', 0] },
              spaceContact: { $arrayElemAt: ['$spaceContacts', 0] },
            },
          },

          {
            $lookup: {
              from: 'banneds',
              let: { otherPartyId: '$otherParty._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        {
                          $and: [
                            { $eq: ['$bannedBy', userId] },
                            { $eq: ['$bannedUser', '$$otherPartyId'] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ['$bannedBy', '$$otherPartyId'] },
                            { $eq: ['$bannedUser', userId] },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  $project: { _id: 1, bannedBy: 1, bannedUser: 1 },
                },
              ],
              as: 'blockDocs',
            },
          },
          {
            $addFields: {
              iBlockedThem: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$blockDocs',
                        as: 'b',
                        cond: { $eq: ['$$b.bannedBy', userId] },
                      },
                    },
                  },
                  0,
                ],
              },
              theyBlockedMe: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$blockDocs',
                        as: 'b',
                        cond: { $ne: ['$$b.bannedBy', userId] },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },

          {
            $addFields: {
              resolvedAvatar: {
                $cond: {
                  if: '$theyBlockedMe',
                  then: null,
                  else: {
                    $ifNull: [
                      '$userContact.avatar',
                      {
                        $ifNull: ['$spaceContact.avatar', '$otherParty.avatar'],
                      },
                    ],
                  },
                },
              },
              resolvedName: {
                $ifNull: [
                  '$userContact.name',
                  { $ifNull: ['$spaceContact.name', '$otherParty.name'] },
                ],
              },
              resolvedProfileColor: {
                $ifNull: [
                  '$userContact.profileColor',
                  {
                    $ifNull: [
                      '$spaceContact.profileColor',
                      '$otherParty.profileColor',
                    ],
                  },
                ],
              },
            },
          },

          {
            $addFields: {
              effectiveLastMessageId: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$lastMessage',
                  else: '$space.lastMessage',
                },
              },
            },
          },

          {
            $lookup: {
              from: 'messages',
              localField: 'effectiveLastMessageId',
              foreignField: '_id',
              as: 'lastMessageData',
            },
          },
          {
            $unwind: {
              path: '$lastMessageData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'calls',
              let: { spaceId: '$space._id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$space', '$$spaceId'] },
                    status: {
                      $in: ['initiated', 'ringing', 'in-progress'],
                    },
                  },
                },
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
                {
                  $project: {
                    _id: 1,
                    type: 1,
                    status: 1,
                  },
                },
              ],
              as: 'activeCallData',
            },
          },
          {
            $addFields: {
              activeCall: { $arrayElemAt: ['$activeCallData', 0] },
            },
          },
          {
            $project: {
              _id: '$space._id',
              unreadCount: 1,
              isPined: 1,
              isMuted: 1,
              isArchived: 1,
              adminTag: 1,
              adminTagColor: 1,
              permissions: 1,
              role: 1,
              folder: { $ifNull: ['$folder', null] },

              channelsCount: '$space.channelsCount',
              groupsCount: '$space.groupsCount',
              membersCount: '$space.membersCount',
              type: '$space.type',
              status: '$space.status',
              createdAt: '$space.createdAt',
              updatedAt: '$space.updatedAt',
              settings: '$space.settings',

              lastMessage: {
                $cond: {
                  if: { $ne: ['$lastMessageData', null] },
                  then: {
                    isOutgoing: { $eq: ['$lastMessageData.sender', userId] },
                    id: '$lastMessageData._id',
                    status: '$lastMessageData.status',
                    text: '$lastMessageData.text',
                    createdAt: '$lastMessageData.createdAt',
                  },
                  else: null,
                },
              },

              isContact: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: { $gt: [{ $size: '$userContacts' }, 0] },
                  else: false,
                },
              },

              iBlockedThem: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$iBlockedThem',
                  else: false,
                },
              },
              theyBlockedMe: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$theyBlockedMe',
                  else: false,
                },
              },

              wallpaper: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ['$wallpaper', null] },
                      { $ne: ['$wallpaper', ''] },
                    ],
                  },
                  then: '$wallpaper',
                  else: '$space.wallpaper',
                },
              },

              name: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$resolvedName',
                  else: '$space.name',
                },
              },

              avatar: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$resolvedAvatar',
                  else: '$space.avatar',
                },
              },

              profileColor: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$resolvedProfileColor',
                  else: '$space.profileColor',
                },
              },

              received: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: {
                    _id: '$otherParty._id',
                    name: '$resolvedName',
                    username: '$otherParty.username',
                    avatar: '$resolvedAvatar',
                    profileColor: '$resolvedProfileColor',
                    bio: '$otherParty.bio',
                  },
                  else: null,
                },
              },

              isActiveCall: { $gt: [{ $size: '$activeCallData' }, 0] },
              activeCallType: { $ifNull: ['$activeCall.type', null] },
              activeCallId: { $ifNull: ['$activeCall._id', null] },
            },
          },
        ],
      },
    });

    return spaces;
  }
}
