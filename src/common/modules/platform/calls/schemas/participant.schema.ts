import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParticipantStatus } from '../../../../types/enums';

export type ParticipantDocument = Participant & Document;

@Schema({ timestamps: true })
export class Participant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Member', required: true, index: true })
  member: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Call', required: true, index: true })
  call: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space', required: true, index: true })
  space: Types.ObjectId;

  @Prop({
    type: String,
    enum: ParticipantStatus,
    default: ParticipantStatus.INVITED,
  })
  status: ParticipantStatus;

  @Prop({
    type: String,
    enum: ['host', 'co-host', 'participant', 'viewer'],
    default: 'participant',
  })
  callRole: string;

  @Prop({ required: false })
  invitedAt?: Date;

  @Prop({ required: false })
  joinedAt?: Date;

  @Prop({ required: false })
  leftAt?: Date;

  @Prop({ default: false })
  isMuted: boolean;

  @Prop({ default: false })
  isVideoOn: boolean;

  @Prop({ default: false })
  isScreenSharing: boolean;

  @Prop({ default: false })
  isHandRaised: boolean;

  @Prop({ default: false })
  isSpeaking: boolean;

  @Prop({ default: 0 })
  audioLevel: number;

  @Prop({
    type: String,
    enum: ['low', 'medium', 'high', 'excellent'],
    default: 'medium',
  })
  connectionQuality?: string;

  @Prop({ type: Object, required: false })
  deviceInfo?: {
    deviceId?: string;
    browser?: string;
    os?: string;
    ip?: string;
    audioDevice?: string;
    videoDevice?: string;
    userAgent?: string;
  };

  @Prop({ type: Object, required: false })
  preferences?: {
    autoAcceptInvite?: boolean;
    defaultMuted?: boolean;
    defaultVideoOff?: boolean;
    audioInputDevice?: string;
    videoInputDevice?: string;
    audioOutputDevice?: string;
  };

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;

  @Prop({ default: 0 })
  viewerCount?: number;

  @Prop({ required: false })
  lastInteractionAt?: Date;

  @Prop({ default: 0 })
  handRaisedCount?: number;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

ParticipantSchema.index({ call: 1, user: 1 }, { unique: true });
ParticipantSchema.index({ call: 1, member: 1 }, { unique: true });
ParticipantSchema.index({ call: 1, status: 1 });
ParticipantSchema.index({ member: 1, status: 1 });
ParticipantSchema.index({ space: 1, status: 1 });
ParticipantSchema.index({ callRole: 1 });
ParticipantSchema.index({ isHandRaised: 1, call: 1 });
ParticipantSchema.index({ isSpeaking: 1, call: 1 });
ParticipantSchema.index({ connectionQuality: 1 });
ParticipantSchema.index({ joinedAt: -1 });
ParticipantSchema.index({ 'deviceInfo.ip': 1 });
ParticipantSchema.index({ call: 1, callRole: 1, status: 1 });
ParticipantSchema.index({ space: 1, call: 1, status: 1 });
