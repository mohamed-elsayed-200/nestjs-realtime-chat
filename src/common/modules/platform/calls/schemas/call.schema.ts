import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CallScope, CallStatus, CallType } from '../../../../types/enums';

export type CallDocument = Call & Document;

@Schema({ timestamps: true })
export class Call {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  caller?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  receiver?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space', required: true })
  space: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  endedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: CallScope,
    required: true,
    default: CallScope.PRIVATE,
  })
  scope: CallScope;

  @Prop({
    type: String,
    enum: CallType,
    required: true,
    default: CallType.AUDIO,
  })
  type: CallType;

  @Prop({
    type: String,
    enum: CallStatus,
    required: true,
    default: CallStatus.INITIATED,
  })
  status: CallStatus;

  @Prop({ required: false })
  startedAt?: Date;

  @Prop({ required: false })
  endedAt?: Date;

  @Prop({ required: false })
  duration?: number;

  @Prop({ required: false })
  recordingUrl?: string;

  @Prop({ default: false })
  isConference: boolean;

  @Prop({ default: 100 })
  maxParticipants: number;

  @Prop({ default: false })
  isRecording: boolean;

  @Prop({ default: false })
  isBroadcast: boolean;

  @Prop({ default: 0 })
  participantsCount: number;

  @Prop({ default: 0 })
  maxConcurrentParticipants: number;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ required: false })
  scheduledAt?: Date;
}

export const CallSchema = SchemaFactory.createForClass(Call);

// Indexes
CallSchema.index({ space: 1, createdAt: -1 });
CallSchema.index({ space: 1, status: 1 });
CallSchema.index({ caller: 1, createdAt: -1 });
CallSchema.index({ receiver: 1, createdAt: -1 });
CallSchema.index({ status: 1, createdAt: -1 });
CallSchema.index({ scope: 1, status: 1 });
CallSchema.index({ createdBy: 1, createdAt: -1 });
CallSchema.index({ scheduledAt: 1, status: 1 });
CallSchema.index({ 'metadata.priority': 1 });
CallSchema.set('toObject', { virtuals: true });
CallSchema.set('toJSON', { virtuals: true });
