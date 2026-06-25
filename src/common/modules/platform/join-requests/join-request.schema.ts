import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JoinRequestDocument = HydratedDocument<JoinRequest>;

export enum JoinRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class JoinRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space', required: true })
  space: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: JoinRequestStatus,
    default: JoinRequestStatus.PENDING,
  })
  status: JoinRequestStatus;

  @Prop()
  message?: string;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  rejectionReason?: string;
}

export const JoinRequestSchema = SchemaFactory.createForClass(JoinRequest);

JoinRequestSchema.index({ space: 1, status: 1 });
JoinRequestSchema.index({ user: 1, space: 1 }, { unique: true });
JoinRequestSchema.index({ createdAt: -1 });
