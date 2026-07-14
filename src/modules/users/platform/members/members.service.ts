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

  public async updateMember({ dto, memberId, authUser }) {
    const {
      space,
      role, // optional — promote/demote
      permissions, // optional — edit permissions
      adminTag, // optional — for admin
      adminTagColor, // optional — for admin
    } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(memberId);

    // 1. Auth member
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');

    // 2. Rank check
    const isOwner = authMember.role === SpaceMemberRole.OWNER;
    const isAdmin = authMember.role === SpaceMemberRole.ADMIN;
    const canManageAdmins = authMember.permissions?.includes(
      SpaceMemberPermission.MANAGE_ADMINS,
    );

    // Owners have full access.
    // Admins can only manage members (not other admins) and update their permissions.
    if (!isOwner && !(isAdmin && canManageAdmins)) {
      throw new BadRequestException('members.noPermission');
    }

    // 3. Target member
    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId, isDeleted: false },
    });
    if (!targetMember) throw new NotFoundException('members.notFound');

    // 4. Cannot modify owner
    if (targetMember.role === SpaceMemberRole.OWNER) {
      throw new BadRequestException('members.cannotModifyOwner');
    }

    // 5. Admin cannot modify another admin (only owner can)
    if (!isOwner && targetMember.role === SpaceMemberRole.ADMIN) {
      throw new BadRequestException('members.cannotModifyAdmin');
    }

    // 6. Build update
    const updatePayload: any = {};

    // === ROLE CHANGE ===
    if (role !== undefined) {
      // Cannot assign owner role
      if (role === SpaceMemberRole.OWNER) {
        throw new BadRequestException('members.useTransferOwnership');
      }

      // Only owner can promote to admin
      if (role === SpaceMemberRole.ADMIN && !isOwner) {
        throw new BadRequestException('members.onlyOwnerCanPromote');
      }

      // Admin demoting admin? No (only owner)
      if (
        role === SpaceMemberRole.MEMBER &&
        targetMember.role === SpaceMemberRole.ADMIN &&
        !isOwner
      ) {
        throw new BadRequestException('members.onlyOwnerCanDismiss');
      }

      updatePayload.role = role;

      // Demoting admin → member: clear admin fields
      if (
        role === SpaceMemberRole.MEMBER &&
        targetMember.role === SpaceMemberRole.ADMIN
      ) {
        updatePayload.permissions = [];
        updatePayload.adminTag = null;
        updatePayload.adminTagColor = null;
      }
    }

    // === PERMISSIONS ===
    if (permissions !== undefined) {
      const validPermissions = Object.values(SpaceMemberPermission) as string[];
      const filtered = permissions.filter((p: string) =>
        validPermissions.includes(p),
      );

      const targetWillBeAdmin =
        role === SpaceMemberRole.ADMIN ||
        (!role && targetMember.role === SpaceMemberRole.ADMIN);

      if (targetWillBeAdmin) {
        // Admin: save all valid permissions
        updatePayload.permissions = filtered;
      } else {
        // Member: save only member-level permissions
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
        updatePayload.permissions = filtered.filter((p: string) =>
          memberPermissions.includes(p as SpaceMemberPermission),
        );
      }
    }

    // === ADMIN TAGS (admin only) ===
    const targetIsOrWillBeAdmin =
      role === SpaceMemberRole.ADMIN ||
      (!role && targetMember.role === SpaceMemberRole.ADMIN);

    if (targetIsOrWillBeAdmin) {
      if (adminTag !== undefined) updatePayload.adminTag = adminTag || 'Admin';
      if (adminTagColor !== undefined)
        updatePayload.adminTagColor = adminTagColor || '#3b82f6';
    }

    // 7. Execute
    if (Object.keys(updatePayload).length === 0) {
      return targetMember; // Nothing to update
    }

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: updatePayload,
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
            permission: [],
            role: null,
          }
        : {
            isBanned: true,
            bannedReason: bannedReason ?? null,
            bannedAt: new Date(),
            isDeleted: true,
            permission: [],
            role: null,
          },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');

    return updated;
  }
}
