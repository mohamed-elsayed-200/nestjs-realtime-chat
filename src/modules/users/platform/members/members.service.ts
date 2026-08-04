import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { Types } from 'mongoose';
import {
  adminPermissionList,
  memberPermissionList,
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../common/types/enums';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';

@Injectable()
export class MembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
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
            $addFields: {
              rolePriority: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$role', SpaceMemberRole.OWNER] },
                      then: 0,
                    },
                    {
                      case: { $eq: ['$role', SpaceMemberRole.ADMIN] },
                      then: 1,
                    },
                    {
                      case: { $eq: ['$role', SpaceMemberRole.MEMBER] },
                      then: 2,
                    },
                  ],
                  default: 3,
                },
              },
            },
          },
          {
            $sort: {
              rolePriority: 1,
              joinedAt: -1,
            },
          },
          {
            $project: {
              user: {
                id: '$user._id',
                name: '$user.name',
                username: '$user.username',
                profileColor: '$user.profileColor',
                avatar: '$user.avatar',
              },
              addedById: '$addedBy',
              bannedById: '$bannedBy',
              promotedById: '$promotedBy',
              role: 1,
              adminTag: 1,
              adminTagColor: 1,
              permissions: 1,
              joinedAt: 1,
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
              id: 1,
              bannedAt: 1,
              user: {
                id: '$user._id',
                name: '$user.name',
                username: '$user.username',
                profileColor: '$user.profileColor',
                avatar: '$user.avatar',
              },
            },
          },
        ],
      },
    });
  }

  public async getOne({ query }) {
    const { memberId, userId, spaceId } = query;
    let finalQuery: any = {};
    if (memberId) {
      finalQuery._id = new Types.ObjectId(memberId);
    }
    if (userId) {
      finalQuery.user = new Types.ObjectId(userId);
    }
    if (spaceId) {
      finalQuery.space = new Types.ObjectId(spaceId);
    }

    if (!memberId && !userId && !spaceId)
      throw new NotFoundException('members.notFoundOne');

    const member = await this.membersRepository.findOne({
      query: finalQuery,
      populate: [
        {
          path: 'user',
          model: 'User',
          select: 'name avatar profileColor username bio',
        },
        {
          path: 'bannedBy',
          model: 'User',
          select: 'name avatar profileColor username',
        },
        {
          path: 'promotedBy',
          model: 'User',
          select: 'name avatar profileColor username',
        },
        {
          path: 'addedBy',
          model: 'User',
          select: 'name avatar profileColor username',
        },
        {
          path: 'space',
          model: 'Space',
          select: 'name profileColor avatar type',
        },
      ],
      select:
        'isBanned addedBy promotedBy deletedAt bannedAt joinedAt role adminTag adminTagColor isDeleted user bannedBy space permissions bannedReason',
    });

    if (!member) throw new NotFoundException('members.notFoundOne');

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
    const iamOwner = authMember.role === SpaceMemberRole.OWNER;
    const iamAdmin = authMember.role === SpaceMemberRole.ADMIN;
    const canPromoteAdmin =
      iamOwner ||
      (iamAdmin &&
        authMember.permissions.includes(SpaceMemberPermission.ADD_ADMINS));

    if (!canPromoteAdmin)
      throw new BadRequestException('members.onlyOwnerCanPromote');

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
    const validPermissions = iamOwner
      ? (Object.values(SpaceMemberPermission) as string[])
      : authMember?.permissions;
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

    return {
      memberId: updated?._id?.toString(),
      spaceId: updated?.space?.toString(),
      userId: updated?.user?.toString(),
      promotedById: updated?.promotedBy,
      role: updated?.role,
      permissions: updated?.permissions,
      adminTag: updated?.adminTag,
      adminTagColor: updated?.adminTagColor,
    };
  }

  public async dismissAdmin({ dto, authUser }) {
    const { member, space } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner or Admin with MANAGE_ADMINS
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');

    const isOwner = authMember.role === SpaceMemberRole.OWNER;
    const isAdmin = authMember.role === SpaceMemberRole.ADMIN;
    const canManageAdmins = authMember.permissions?.includes(
      SpaceMemberPermission.ADD_ADMINS,
    );

    if (!isOwner && !(isAdmin && canManageAdmins)) {
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

    // 2.1 Non-owner admins can only dismiss admins they personally promoted
    if (
      !isOwner &&
      targetMember.promotedBy?.toString() !== userObjectId.toString()
    ) {
      throw new BadRequestException('members.noPermission');
    }

    // 3. Dismiss: keep member-level permissions only
    const currentPerms = targetMember.permissions || [];
    const keptPerms = currentPerms.filter((p) =>
      memberPermissionList.includes(p),
    );

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
    return {
      memberId: updated?._id?.toString(),
      spaceId: updated?.space?.toString(),
      userId: updated?.user?.toString(),
      role: updated?.role,
      permissions: updated?.permissions,
      promotedBy: null,
      adminTag: null,
      adminTagColor: null,
    };
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

    const iamOwner = authMember.role === SpaceMemberRole.OWNER;
    const canChangeAdminPerm = authMember.permissions?.includes(
      SpaceMemberPermission.ADD_ADMINS,
    );
    if (!iamOwner && !canChangeAdminPerm) {
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

    // 2.1 Non-owner admins can only manage admins they personally promoted
    if (
      !iamOwner &&
      targetMember.promotedBy?.toString() !== userObjectId.toString()
    ) {
      throw new BadRequestException('members.noPermission');
    }

    // 3. Validate requested permissions against the full valid list (member + admin)
    const validPermissions: string[] = [
      ...memberPermissionList,
      ...adminPermissionList,
    ];
    const uniquePermissions = [...new Set(permissions as string[])];
    const filtered = uniquePermissions.filter((p) =>
      validPermissions.includes(p),
    );

    // 4. Split current permissions into member vs admin buckets using the shared lists
    const currentPerms = targetMember.permissions || [];
    const memberPerms = currentPerms.filter((p) =>
      memberPermissionList.includes(p),
    );
    const currentAdminPerms = currentPerms.filter((p) =>
      adminPermissionList.includes(p),
    );

    // 5. Determine which admin-level permissions authUser is actually allowed to touch.
    //    Owner controls all admin perms; a regular admin only controls admin perms they own.
    const authControlledPerms = iamOwner
      ? adminPermissionList
      : (authMember.permissions || []).filter((p) =>
          adminPermissionList.includes(p),
        );

    // Perms the target currently has that authUser has NO control over -> preserve as-is
    const untouchableAdminPerms = currentAdminPerms.filter(
      (p) => !authControlledPerms.includes(p),
    );

    // Perms from the request that authUser IS allowed to grant/revoke (admin perms only)
    const editableAdminPerms = filtered.filter(
      (p) => adminPermissionList.includes(p) && authControlledPerms.includes(p),
    );

    const newAdminPerms = [
      ...new Set([...untouchableAdminPerms, ...editableAdminPerms]),
    ];

    // 6. Build update payload
    const updatePayload: any = {
      permissions: [...memberPerms, ...newAdminPerms],
    };

    if (adminTag !== undefined) updatePayload.adminTag = adminTag || 'Admin';
    if (adminTagColor !== undefined)
      updatePayload.adminTagColor = adminTagColor || '#3b82f6';

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: updatePayload,
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return {
      memberId: updated?._id?.toString(),
      spaceId: updated?.space?.toString(),
      userId: updated?.user?.toString(),
      role: updated?.role,
      permissions: updated?.permissions,
      adminTag: updated?.adminTag,
      adminTagColor: updated?.adminTagColor,
    };
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

    const iamOwner = authMember.role === SpaceMemberRole.OWNER;
    const iamAdmin = authMember.role === SpaceMemberRole.ADMIN;

    if (!iamOwner && !iamAdmin) {
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

    // 2.1 If target is an ADMIN, authUser must also have MANAGE_ADMINS to touch their perms
    if (targetMember.role === SpaceMemberRole.ADMIN) {
      const canManageAdmins = authMember.permissions?.includes(
        SpaceMemberPermission.ADD_ADMINS,
      );
      if (!iamOwner && !canManageAdmins) {
        throw new BadRequestException('members.noPermission');
      }
    }

    // 3. Only accept requested permissions that are valid member permissions
    const uniquePermissions = [...new Set(permissions as string[])];
    const requestedMemberPerms = uniquePermissions.filter((p) =>
      memberPermissionList.includes(p as SpaceMemberPermission),
    );

    // 4. Determine which member-level permissions authUser is actually allowed to touch.
    //    Owner controls all member perms; a regular admin only controls member perms they own.
    const authControlledPerms = iamOwner
      ? memberPermissionList
      : (authMember.permissions || []).filter((p) =>
          memberPermissionList.includes(p as SpaceMemberPermission),
        );

    // 5. Current member perms the target has that authUser has NO control over -> preserve as-is
    const currentPerms = targetMember.permissions || [];
    const currentMemberPerms = currentPerms.filter((p) =>
      memberPermissionList.includes(p as SpaceMemberPermission),
    );
    const untouchableMemberPerms = currentMemberPerms.filter(
      (p) => !authControlledPerms.includes(p as SpaceMemberPermission),
    );

    // 6. Perms from the request that authUser IS allowed to grant/revoke
    const editableMemberPerms = requestedMemberPerms.filter((p) =>
      authControlledPerms.includes(p as SpaceMemberPermission),
    );

    const newMemberPerms = [
      ...new Set([...untouchableMemberPerms, ...editableMemberPerms]),
    ];

    // 7. Keep admin perms as-is + apply new member perms
    const adminPerms = currentPerms.filter((p) =>
      adminPermissionList.includes(p as SpaceMemberPermission),
    );

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        permissions: [...adminPerms, ...newMemberPerms],
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return {
      memberId: updated?._id?.toString(),
      spaceId: updated?.space?.toString(),
      userId: updated?.user?.toString(),
      role: updated?.role,
      permissions: updated?.permissions,
    };
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
        permissions: adminPermissionList,
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
      transferredFrom: demoted,
      transferredTo: promoted,
      spaceCreatedBy: targetMember.user,
      spaceId: spaceObjectId?.toString(),
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
            permission: memberPermissionList,
            role: SpaceMemberRole.MEMBER,
          }
        : {
            isDeleted: true,
            isBanned: true,
            bannedReason: bannedReason ?? null,
            bannedAt: new Date(),
            bannedBy: userObjectId,
            permission: memberPermissionList,
            role: SpaceMemberRole.MEMBER,
          },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');

    return {
      ...updated.toObject(),
      id: updated?.id?.toString(),
      spaceId: updated?.space?.toString(),
      __v: undefined,
      _id: undefined,
    };
  }

  public async addMembers({ space, dto, authUser }) {
    const { members: memberIds } = dto;
    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);

    const member = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!member) throw new NotFoundException('members.notFound');
    if (member.role !== SpaceMemberRole.OWNER)
      throw new BadRequestException('spaces.cantAddMembers');
    const mappedIds: string[] = memberIds.map((id: any) => String(id));
    const uniqueIds: string[] = [...new Set<string>(mappedIds)];
    const validUsers = await this.usersRepository.findMany({
      query: {
        _id: { $in: uniqueIds.map((id: string) => new Types.ObjectId(id)) },
      },
      select: '_id',
    });
    if (validUsers.length === 0) throw new NotFoundException('users.notFound');

    const userIds: string[] = validUsers.map((u: any) => u._id.toString());

    const existing = await this.membersRepository.findMany({
      query: {
        space: spaceObjectId,
        user: { $in: userIds.map((id: string) => new Types.ObjectId(id)) },
      },
      select: 'user isDeleted',
    });

    const existingMap = new Map(
      existing.map((m) => [m.user.toString(), m.isDeleted]),
    );

    const toRestore: string[] = [];
    const toInsert: string[] = [];

    for (const id of userIds) {
      const isDeleted = existingMap.get(id);
      if (isDeleted === undefined) toInsert.push(id);
      else if (isDeleted === true) toRestore.push(id);
    }

    if (toRestore.length > 0) {
      await this.membersRepository.updateMany({
        query: {
          space: spaceObjectId,
          user: { $in: toRestore.map((id) => new Types.ObjectId(id)) },
          isDeleted: true,
        },
        dto: {
          isDeleted: false,
          isBanned: false,
          bannedAt: null,
          deletedAt: null,
          joinedAt: new Date(),
        },
      });
    }

    if (toInsert.length > 0) {
      await this.membersRepository.insertMany({
        documents: toInsert.map((userId) => ({
          user: new Types.ObjectId(userId),
          space: spaceObjectId,
          role: SpaceMemberRole.MEMBER,
          joinedAt: new Date(),
          isPined: false,
          isMuted: false,
          isArchived: false,
          permissions: [],
        })),
      });
    }

    const total = toRestore.length + toInsert.length;
    if (total === 0) {
      return {
        space: await this.spacesRepository.findOne({
          query: { _id: spaceObjectId },
        }),
        addedUserIds: [],
      };
    }

    const updateSpace = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: total } },
    });

    return {
      space: {
        ...updateSpace.toObject(),
        id: updateSpace._id?.toString(),
        _id: undefined,
      },
      addedUserIds: [...toInsert, ...toRestore],
    };
  }
}
