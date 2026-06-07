import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SpaceMemberRole } from '../../../../common/types/enums';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ timestamps: true })
export class Member {
  @Prop({ type: Types.ObjectId, ref: 'Space', index: true })
  space: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({ enum: SpaceMemberRole, default: SpaceMemberRole.MEMBER })
  role: SpaceMemberRole;

  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  lastReadMessage: Types.ObjectId;

  @Prop()
  joinedAt: Date;

  // Mute
  @Prop({ default: false })
  isMuted: boolean;

  @Prop({ default: null })
  mutedUntil: Date;

  // Ban
  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ default: null })
  bannedAt: Date;

  @Prop({ default: null })
  mutedAt: Date;

  @Prop({ default: null })
  bannedReason: string;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ user: 1, space: 1 });
MemberSchema.index({ space: 1, isBanned: 1 });
MemberSchema.index({ space: 1, isMuted: 1 });
