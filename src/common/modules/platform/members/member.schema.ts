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

  @Prop()
  wallpaper: string;

  @Prop({ enum: SpaceMemberRole, default: SpaceMemberRole.MEMBER })
  role: SpaceMemberRole;

  @Prop({
    type: [String],
    enum: SpaceMemberPermission,
    default: [],
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
  isRestricted: boolean;

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
  restrictedAt?: Date;

  @Prop()
  mutedAt?: Date;

  @Prop()
  bannedAt?: Date;

  @Prop()
  joinedAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ user: 1, space: 1 });
MemberSchema.index({ space: 1, isBanned: 1 });
MemberSchema.index({ space: 1, unreadCount: 1 });
