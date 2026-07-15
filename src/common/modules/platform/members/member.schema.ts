import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../common/types/enums';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ timestamps: true })
export class Member {
  @Prop({ type: Types.ObjectId, ref: 'Space', index: true })
  space: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Folder', index: true })
  folder: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  addedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  promotedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  bannedBy: Types.ObjectId;

  @Prop()
  wallpaper: string;

  @Prop({ enum: SpaceMemberRole, default: SpaceMemberRole.MEMBER })
  role: SpaceMemberRole;

  @Prop({
    type: [String],
    enum: SpaceMemberPermission,
    default: [
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
    ],
  })
  permissions: SpaceMemberPermission[];

  @Prop()
  adminTag: string;

  @Prop()
  adminTagColor: string;

  @Prop()
  bannedReason: string;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ default: false })
  isPined: boolean;

  @Prop({ default: false })
  isMuted: boolean;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;

  // Dates
  @Prop()
  deletedAt?: Date;

  @Prop()
  bannedAt?: Date;

  @Prop()
  joinedAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ user: 1, space: 1 });
MemberSchema.index({ space: 1, isBanned: 1 });
MemberSchema.index({ space: 1, unreadCount: 1 });
