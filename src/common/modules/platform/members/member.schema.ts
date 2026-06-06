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

  @Prop({
    enum: SpaceMemberRole,
    default: SpaceMemberRole.MEMBER,
  })
  role: SpaceMemberRole;

  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  lastReadMessage: Types.ObjectId;

  @Prop()
  joinedAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
