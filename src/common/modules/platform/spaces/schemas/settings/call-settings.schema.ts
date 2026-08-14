import { Prop, Schema } from '@nestjs/mongoose';
import { JoinApproval, PermissionLevel } from '../../../../../types/enums';

@Schema({ _id: false })
export class CallSettings {
  // ─── General ───
  @Prop({ default: 'Weekly Team Meeting' })
  callName: string;

  @Prop({ default: '' })
  callDescription: string;

  @Prop({ default: 10 })
  maxParticipants: number;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowJoin: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowRejoin: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowInviteLinks: PermissionLevel;

  @Prop({ default: true })
  autoEndOnEmpty: boolean;

  // ─── Audio & Video defaults ───
  @Prop({ type: String, enum: ['on', 'off'], default: 'on' })
  defaultMic: string;

  @Prop({ type: String, enum: ['on', 'off'], default: 'on' })
  defaultCamera: string;

  @Prop({ default: true })
  noiseSuppression: boolean;

  @Prop({ default: true })
  echoCancellation: boolean;

  @Prop({
    type: String,
    enum: ['low', 'standard', 'high'],
    default: 'standard',
  })
  audioQuality: string;

  @Prop({
    type: String,
    enum: ['low', 'standard', 'high'],
    default: 'standard',
  })
  videoQuality: string;

  @Prop({ type: String, enum: ['480p', '720p', '1080p'], default: '720p' })
  cameraResolution: string;

  @Prop({ default: true })
  mirrorCamera: boolean;

  @Prop({ default: false })
  backgroundBlur: boolean;

  @Prop({ default: false })
  virtualBackground: boolean;

  // ─── Participants (PermissionLevel) ───
  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowInviteOthers: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowScreenShare: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSendMessages: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowReactions: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowRaiseHand: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSelfUnmute: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSelfCameraOn: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowRename: PermissionLevel;

  // ─── Chat ───
  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  chatEnabled: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowPrivateMessages: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  chatReactions: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowFileSharing: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowLinks: PermissionLevel;

  // ─── Screen Sharing ───
  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  multipleSharers: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowTakeControl: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  shareAudio: PermissionLevel;

  // ─── Recording ───
  @Prop({ default: false })
  recordingEnabled: boolean;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  whoCanRecord: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  recordingNotifications: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  recordAudio: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  recordVideo: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  recordScreen: PermissionLevel;

  @Prop({ default: false })
  autoRecording: boolean;

  @Prop({ type: String, enum: ['7', '30', '90', 'forever'], default: '30' })
  retention: string;

  // ─── Privacy ───
  @Prop({ type: String, enum: ['public', 'private'], default: 'private' })
  callVisibility: string;

  @Prop({ type: String, enum: ['link', 'invite', 'domain'], default: 'invite' })
  callAccess: string;

  @Prop({ enum: JoinApproval, default: JoinApproval.ANYONE_CAN_JOIN })
  joinApproval: JoinApproval;

  @Prop({ default: '' })
  password: string;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowGuests: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.NOBODY })
  hideParticipantList: PermissionLevel;
}
