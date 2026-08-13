import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class CallSettings {
  @Prop({ default: 'Weekly Team Meeting' })
  callName: string;

  @Prop({ default: '' })
  callDescription: string;

  @Prop({ default: 100 })
  maxParticipants: number;

  @Prop({ default: true })
  allowJoin: boolean;

  @Prop({ default: true })
  allowRejoin: boolean;

  @Prop({ default: false })
  waitingRoom: boolean;

  @Prop({ default: false })
  requireApproval: boolean;

  @Prop({ default: true })
  allowInviteLinks: boolean;

  @Prop({ default: true })
  autoEndOnEmpty: boolean;

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

  @Prop({ default: true })
  allowInviteOthers: boolean;

  @Prop({ default: true })
  allowScreenShare: boolean;

  @Prop({ default: true })
  allowSendMessages: boolean;

  @Prop({ default: true })
  allowReactions: boolean;

  @Prop({ default: true })
  allowRaiseHand: boolean;

  @Prop({ default: true })
  allowSelfUnmute: boolean;

  @Prop({ default: true })
  allowSelfCameraOn: boolean;

  @Prop({ default: false })
  allowRename: boolean;

  @Prop({ default: true })
  canMute: boolean;

  @Prop({ default: true })
  canRemove: boolean;

  @Prop({ default: true })
  canBan: boolean;

  @Prop({ default: true })
  canDisableMic: boolean;

  @Prop({ default: true })
  canDisableCamera: boolean;

  @Prop({ default: true })
  canDisableScreenShare: boolean;

  @Prop({ default: true })
  canLockCall: boolean;

  @Prop({ default: true })
  canManageWaitingRoom: boolean;

  @Prop({ default: true })
  canPromote: boolean;

  @Prop({ default: false })
  canTransferHost: boolean;

  @Prop({ default: true })
  canEndForEveryone: boolean;

  @Prop({ default: true })
  chatEnabled: boolean;

  @Prop({ default: true })
  everyoneCanMessage: boolean;

  @Prop({ default: true })
  allowPrivateMessages: boolean;

  @Prop({ default: true })
  chatReactions: boolean;

  @Prop({ default: false })
  allowFileSharing: boolean;

  @Prop({ default: true })
  allowLinks: boolean;

  @Prop({ default: true })
  canDeleteMessages: boolean;

  @Prop({ default: true })
  canClearChat: boolean;

  @Prop({ default: true })
  screenShareEnabled: boolean;

  @Prop({ default: false })
  multipleSharers: boolean;

  @Prop({ default: false })
  allowTakeControl: boolean;

  @Prop({ default: true })
  shareAudio: boolean;

  @Prop({ default: false })
  limitToModerators: boolean;

  @Prop({ default: false })
  recordingEnabled: boolean;

  @Prop({
    type: String,
    enum: ['host', 'moderators', 'everyone'],
    default: 'host',
  })
  whoCanRecord: string;

  @Prop({ default: true })
  recordingNotifications: boolean;

  @Prop({ default: true })
  recordAudio: boolean;

  @Prop({ default: true })
  recordVideo: boolean;

  @Prop({ default: true })
  recordScreen: boolean;

  @Prop({ default: false })
  autoRecording: boolean;

  @Prop({ type: String, enum: ['7', '30', '90', 'forever'], default: '30' })
  retention: string;

  @Prop({ type: String, enum: ['public', 'private'], default: 'private' })
  callVisibility: string;

  @Prop({ type: String, enum: ['link', 'invite', 'domain'], default: 'invite' })
  callAccess: string;

  @Prop({ default: false })
  inviteOnly: boolean;

  @Prop({ default: false })
  joinApproval: boolean;

  @Prop({ default: '' })
  password: string;

  @Prop({ default: false })
  waitingRoomSecurity: boolean;

  @Prop({ default: true })
  allowGuests: boolean;

  @Prop({ default: false })
  hideParticipantList: boolean;

  @Prop({ default: false })
  lockCallSecurity: boolean;
}
