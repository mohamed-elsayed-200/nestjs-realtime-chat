import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ActivationStatus,
  ChatHistory,
  JoinApproval,
  SpaceTypes,
  WhoCanAddMembers,
  WhoCanChangeInfo,
  WhoCanDeleteMessages,
  WhoCanPinMessages,
  WhoCanSendMessages,
} from '../../../types/enums';

export type SpaceDocument = HydratedDocument<Space>;

@Schema({ _id: false })
class SpaceSettings {
  // ── Permissions ──
  @Prop({ enum: WhoCanSendMessages, default: WhoCanSendMessages.EVERYONE })
  whoCanSendMessages: WhoCanSendMessages;

  @Prop({ enum: WhoCanAddMembers, default: WhoCanAddMembers.ADMINS_ONLY })
  whoCanAddMembers: WhoCanAddMembers;

  @Prop({ enum: WhoCanChangeInfo, default: WhoCanChangeInfo.ADMINS_ONLY })
  whoCanChangeInfo: WhoCanChangeInfo;

  @Prop({ enum: WhoCanPinMessages, default: WhoCanPinMessages.ADMINS_ONLY })
  whoCanPinMessages: WhoCanPinMessages;

  @Prop({
    enum: WhoCanDeleteMessages,
    default: WhoCanDeleteMessages.ADMINS_ONLY,
  })
  whoCanDeleteMessages: WhoCanDeleteMessages;

  // ── Privacy & Access ──
  @Prop({ enum: JoinApproval, default: JoinApproval.ANYONE_CAN_JOIN })
  joinApproval: JoinApproval;

  @Prop({ enum: ChatHistory, default: ChatHistory.VISIBLE })
  chatHistory: ChatHistory;

  @Prop({ default: false })
  hideMembersList: boolean;

  @Prop({ default: false })
  isSubscriptionRequired: boolean;

  @Prop({ default: true })
  allowCustomNotifications: boolean;

  @Prop({ default: true })
  allowMentions: boolean;

  // ── Content Restrictions ──
  @Prop({ default: false })
  restrictSendingUrls: boolean;

  @Prop({ default: false })
  restrictSendingMedia: boolean;

  @Prop({ default: false })
  restrictSendingStickers: boolean;

  // ── Slow Mode ──
  @Prop({ default: false })
  slowModeEnabled: boolean;

  @Prop({ default: 0 })
  slowModeDelay: number;

  @Prop({ default: false })
  enableSlowModeWarning: boolean;

  // ── Features ──
  @Prop({ default: false })
  enableVoiceChat: boolean;

  // ── Advanced ──
  @Prop({ default: 0 })
  maxMembers: number;

  @Prop({ default: null })
  groupLink: string;

  @Prop({ default: 0 })
  messageExpiryDuration: number;
}

@Schema({ timestamps: true })
export class Space {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  profileColor: string;

  @Prop()
  membersCount: number;

  @Prop()
  avatar: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  received?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage: Types.ObjectId;

  @Prop({
    type: String,
    enum: ActivationStatus,
    default: ActivationStatus.ACTIVE,
  })
  status: ActivationStatus;

  @Prop({
    enum: SpaceTypes,
    default: SpaceTypes.PRIVATE,
  })
  type: SpaceTypes;

  @Prop({ default: false })
  archive: boolean;

  @Prop({ default: false })
  pin: boolean;

  @Prop({ default: false })
  mute: boolean;

  @Prop({ type: SpaceSettings, default: () => ({}) })
  settings: SpaceSettings;
}

export const SpaceSchema = SchemaFactory.createForClass(Space);

SpaceSchema.index({ lastMessage: 1 });
SpaceSchema.index({ received: 1 });
SpaceSchema.index({ createdBy: 1 });
SpaceSchema.index({ status: 1 });
SpaceSchema.index({ sender: 1, received: 1 });
SpaceSchema.index({ received: 1, sender: 1 });
SpaceSchema.index({ type: 1, sender: 1 });
SpaceSchema.index({ type: 1, received: 1 });
