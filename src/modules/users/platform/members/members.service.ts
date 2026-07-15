import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { Types } from 'mongoose';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../common/types/enums';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';

@Injectable()
export class MembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}

  public async getAll({ query, spaceId }) {
    return this.membersRepository.findAll({
      query,
      options: {
        pipelines: [
          {
            $match: {
              space: new Types.ObjectId(spaceId),
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
          {
            $unwind: {
              path: '$space',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'addedBy',
              foreignField: '_id',
              as: 'addedBy',
            },
          },
          {
            $unwind: {
              path: '$addedBy',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'promotedBy',
              foreignField: '_id',
              as: 'promotedBy',
            },
          },
          {
            $unwind: {
              path: '$promotedBy',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'bannedBy',
              foreignField: '_id',
              as: 'bannedBy',
            },
          },
          {
            $unwind: {
              path: '$bannedBy',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              space: {
                id: '$space._id',
                membersCount: '$space.membersCount',
                name: '$space.name',
                type: '$space.type',
                profileColor: '$space.profileColor',
                avatar: '$space.avatar',
              },
              user: {
                id: '$user._id',
                name: '$user.name',
                username: '$user.username',
                profileColor: '$user.profileColor',
                avatar: '$user.avatar',
              },
              addedBy: {
                id: '$addedBy._id',
                name: '$addedBy.name',
                username: '$addedBy.username',
                profileColor: '$addedBy.profileColor',
                avatar: '$addedBy.avatar',
              },
              bannedBy: {
                id: '$bannedBy._id',
                name: '$bannedBy.name',
                username: '$bannedBy.username',
                profileColor: '$bannedBy.profileColor',
                avatar: '$bannedBy.avatar',
              },
              promotedBy: {
                id: '$promotedBy._id',
                name: '$promotedBy.name',
                username: '$promotedBy.username',
                profileColor: '$promotedBy.profileColor',
                avatar: '$promotedBy.avatar',
              },
              role: 1,
              joinedAt: 1,
              adminTag: 1,
              adminTagColor: 1,
              permissions: 1,
              isMuted: 1,
              isBanned: 1,
              bannedAt: 1,
            },
          },
        ],
      },
    });
  }

  public async getBannedBySpace({ query, spaceId }) {
    return this.membersRepository.findAll({
      query,
      options: {
        pipelines: [
          {
            $match: {
              space: new Types.ObjectId(spaceId),
              isBanned: true,
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
          {
            $unwind: {
              path: '$space',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              space: {
                id: '$space._id',
                membersCount: '$space.membersCount',
                name: '$space.name',
                type: '$space.type',
                profileColor: '$space.profileColor',
                avatar: '$space.avatar',
              },
              user: {
                id: '$user._id',
                name: '$user.name',
                username: '$user.username',
                profileColor: '$user.profileColor',
                avatar: '$user.avatar',
              },
              role: 1,
              joinedAt: 1,
              adminTag: 1,
              adminTagColor: 1,
              permissions: 1,
              isMuted: 1,
              isBanned: 1,
              bannedAt: 1,
              bannedReason: 1,
            },
          },
        ],
      },
    });
  }

  public async getOne({ memberId }) {
    const member = await this.membersRepository.findOne({
      query: { _id: memberId },
    });

    if (!member) throw new NotFoundException('members.notFound');

    return member;
  }

  public async promoteAdmin({ dto, authUser }) {
    const { member, space, permissions, adminTag, adminTagColor } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner only
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');
    if (authMember.role !== SpaceMemberRole.OWNER) {
      throw new BadRequestException('members.onlyOwnerCanPromote');
    }

    // 2. Target member
    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId, isDeleted: false },
    });
    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role === SpaceMemberRole.OWNER) {
      throw new BadRequestException('members.cannotModifyOwner');
    }
    if (targetMember.role === SpaceMemberRole.ADMIN) {
      throw new BadRequestException('members.alreadyAdmin');
    }

    // 3. Validate permissions
    const validPermissions = Object.values(SpaceMemberPermission) as string[];
    const uniquePermissions = [...new Set(permissions as string[])];
    const filtered = uniquePermissions.filter((p) =>
      validPermissions.includes(p),
    );

    // 4. Promote
    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        role: SpaceMemberRole.ADMIN,
        permissions: filtered,
        adminTag: adminTag || 'Admin',
        adminTagColor: adminTagColor || '#3b82f6',
        promotedBy: userObjectId,
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return updated;
  }

  public async dismissAdmin({ dto, authUser }) {
    const { member, space } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner only
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');
    if (authMember.role !== SpaceMemberRole.OWNER) {
      throw new BadRequestException('members.onlyOwnerCanDismiss');
    }

    // 2. Target member
    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId, isDeleted: false },
    });
    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role !== SpaceMemberRole.ADMIN) {
      throw new BadRequestException('members.notAdmin');
    }

    // 3. Dismiss: keep member-level permissions only
    const memberPermissions = [
      SpaceMemberPermission.SEND_MESSAGES,
      SpaceMemberPermission.ADD_COMMENTS,
      SpaceMemberPermission.REACTION_MESSAGES,
      SpaceMemberPermission.REACTION_COMMENTS,
      SpaceMemberPermission.SEND_PHOTOS,
      SpaceMemberPermission.SEND_VIDEOS,
      SpaceMemberPermission.SEND_FILES,
      SpaceMemberPermission.SEND_VOICE,
      SpaceMemberPermission.SEND_STICKERS,
      SpaceMemberPermission.SEND_GIFS,
      SpaceMemberPermission.SEND_POLLS,
      SpaceMemberPermission.SEND_LINKS,
      SpaceMemberPermission.INVITE_USERS,
    ];

    const currentPerms = targetMember.permissions || [];
    const keptPerms = currentPerms.filter((p) => memberPermissions.includes(p));

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        role: SpaceMemberRole.MEMBER,
        permissions: keptPerms,
        adminTag: null,
        adminTagColor: null,
        promotedBy: null,
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return updated;
  }

  public async updateAdminPermissions({ dto, authUser }) {
    const { member, space, permissions, adminTag, adminTagColor } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner or Admin with MANAGE_ADMINS
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');

    const isOwner = authMember.role === SpaceMemberRole.OWNER;
    const canManageAdmins = authMember.permissions?.includes(
      SpaceMemberPermission.MANAGE_ADMINS,
    );

    if (
      !isOwner &&
      !(authMember.role === SpaceMemberRole.ADMIN && canManageAdmins)
    ) {
      throw new BadRequestException('members.noPermission');
    }

    // 2. Target member
    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId, isDeleted: false },
    });
    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role !== SpaceMemberRole.ADMIN) {
      throw new BadRequestException('members.notAdmin');
    }

    // 3. Validate permissions
    const validPermissions = Object.values(SpaceMemberPermission) as string[];
    const uniquePermissions = [...new Set(permissions as string[])];
    const filtered = uniquePermissions.filter((p) =>
      validPermissions.includes(p),
    );

    // 4. Update: keep member perms + new admin perms
    const memberPermissionValues = [
      SpaceMemberPermission.SEND_MESSAGES,
      SpaceMemberPermission.ADD_COMMENTS,
      SpaceMemberPermission.REACTION_MESSAGES,
      SpaceMemberPermission.REACTION_COMMENTS,
      SpaceMemberPermission.SEND_PHOTOS,
      SpaceMemberPermission.SEND_VIDEOS,
      SpaceMemberPermission.SEND_FILES,
      SpaceMemberPermission.SEND_VOICE,
      SpaceMemberPermission.SEND_STICKERS,
      SpaceMemberPermission.SEND_GIFS,
      SpaceMemberPermission.SEND_POLLS,
      SpaceMemberPermission.SEND_LINKS,
      SpaceMemberPermission.INVITE_USERS,
    ];

    const currentPerms = targetMember.permissions || [];
    const memberPerms = currentPerms.filter((p) =>
      memberPermissionValues.includes(p),
    );

    const updatePayload: any = {
      permissions: [...memberPerms, ...filtered],
    };

    if (adminTag !== undefined) updatePayload.adminTag = adminTag || 'Admin';
    if (adminTagColor !== undefined)
      updatePayload.adminTagColor = adminTagColor || '#3b82f6';

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: updatePayload,
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return updated;
  }

  public async updateMemberPermissions({ dto, authUser }) {
    const { member, space, permissions } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner or Admin with CHANGE_SPACE_SETTINGS
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');

    const isOwner = authMember.role === SpaceMemberRole.OWNER;
    const canChangePermissions = authMember.permissions?.includes(
      SpaceMemberPermission.CHANGE_SPACE_SETTINGS,
    );

    if (
      !isOwner &&
      !(authMember.role === SpaceMemberRole.ADMIN && canChangePermissions)
    ) {
      throw new BadRequestException('members.noPermission');
    }

    // 2. Target member
    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId, isDeleted: false },
    });
    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role === SpaceMemberRole.OWNER) {
      throw new BadRequestException('members.cannotModifyOwner');
    }

    // 3. Validate member permissions only
    const memberPermissionValues = [
      SpaceMemberPermission.SEND_MESSAGES,
      SpaceMemberPermission.ADD_COMMENTS,
      SpaceMemberPermission.REACTION_MESSAGES,
      SpaceMemberPermission.REACTION_COMMENTS,
      SpaceMemberPermission.SEND_PHOTOS,
      SpaceMemberPermission.SEND_VIDEOS,
      SpaceMemberPermission.SEND_FILES,
      SpaceMemberPermission.SEND_VOICE,
      SpaceMemberPermission.SEND_STICKERS,
      SpaceMemberPermission.SEND_GIFS,
      SpaceMemberPermission.SEND_POLLS,
      SpaceMemberPermission.SEND_LINKS,
      SpaceMemberPermission.INVITE_USERS,
    ];

    const validPermissions = Object.values(SpaceMemberPermission) as string[];
    const uniquePermissions = [...new Set(permissions as string[])];
    const filtered = uniquePermissions.filter(
      (p) =>
        validPermissions.includes(p) &&
        memberPermissionValues.includes(p as SpaceMemberPermission),
    );

    // 4. Update: keep admin perms + new member perms
    const currentPerms = targetMember.permissions || [];
    const adminPerms = currentPerms.filter(
      (p) => !memberPermissionValues.includes(p),
    );

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        permissions: [...adminPerms, ...filtered],
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return updated;
  }

  public async transferOwnership({ dto, authUser }) {
    const { member, space } = dto;
    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });

    if (!authMember) throw new NotFoundException('members.noPermission');
    if (authMember.role !== SpaceMemberRole.OWNER)
      throw new BadRequestException('members.noPermission');

    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      populate: [
        {
          path: 'user',
          model: 'User',
          select: 'name profileColor avatar username',
        },
      ],
    });

    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.alreadyOwner');

    const demoted = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: authMember._id },
      dto: {
        role: SpaceMemberRole.MEMBER,
        permissions: [],
        adminTag: null,
        adminTagColor: null,
      },
    });

    if (!demoted) throw new InternalServerErrorException('members.notUpdated');

    const promoted = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        role: SpaceMemberRole.OWNER,
        permissions: [],
        adminTag: 'Owner',
        adminTagColor: '#22c55e',
      },
    });

    await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: {
        createdBy: new Types.ObjectId(promoted?.user?.toString()),
      },
    });

    if (!promoted) throw new InternalServerErrorException('members.notUpdated');

    return {
      transferredTo: promoted,
      spaceCreatedBy: targetMember.user,
      transferredFrom: demoted,
    };
  }

  public async toggleBan({ dto, authUser }) {
    const { member, space, bannedReason } = dto;
    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });

    if (!authMember) throw new NotFoundException('members.noPermission');

    const isOwner = authMember.role === SpaceMemberRole.OWNER;
    const isAdmin =
      authMember.role === SpaceMemberRole.ADMIN &&
      authMember.permissions?.includes(SpaceMemberPermission.BAN_MEMBERS);
    const canBan = isOwner || isAdmin;
    if (!canBan) throw new BadRequestException('members.noPermission');

    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId },
    });

    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.cannotModifyOwner');
    if (targetMember.role === SpaceMemberRole.ADMIN && !isOwner)
      throw new BadRequestException('members.noPermission');

    const isBanned = targetMember.isBanned;

    if (!isBanned) {
      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { $inc: { membersCount: -1 } },
      });
    }

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: isBanned
        ? {
            isBanned: false,
            bannedReason: null,
            bannedAt: null,
            bannedBy: null,
            permission: [],
            role: null,
          }
        : {
            isBanned: true,
            bannedReason: bannedReason ?? null,
            bannedAt: new Date(),
            isDeleted: true,
            bannedBy: userObjectId,
            permission: [],
            role: null,
          },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');

    return updated;
  }
}
