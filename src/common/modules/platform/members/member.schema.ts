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
  joinedAt: Date;

  @Prop()
  adminTag: string;
  @Prop()
  adminTagColor: string;

  @Prop({ default: false })
  banned: boolean;

  @Prop({ default: null })
  bannedReason: string;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ default: null })
  deletedAt?: Date;

  @Prop({ default: false })
  archive: boolean;

  @Prop({ default: false })
  pin: boolean;

  @Prop({ default: false })
  mute: boolean;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ user: 1, space: 1 });
MemberSchema.index({ space: 1, isBanned: 1 });
MemberSchema.index({ space: 1, unreadCount: 1 });
