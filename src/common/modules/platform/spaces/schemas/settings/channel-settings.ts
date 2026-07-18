import { Prop, Schema } from '@nestjs/mongoose';
import {
  SpaceHistory,
  JoinApproval,
  PermissionLevel,
} from '../../../../../types/enums';

@Schema({ _id: false })
export class ChannelSettings {
  @Prop({ enum: JoinApproval, default: JoinApproval.ANYONE_CAN_JOIN })
  joinApproval: JoinApproval;

  @Prop({ enum: SpaceHistory, default: SpaceHistory.VISIBLE })
  spaceHistory: SpaceHistory;

  @Prop({ default: 0 })
  maxMembers: number;

  @Prop({ default: 0 })
  messageExpiryDuration: number;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  enableSignature: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.MEMBER })
  enableProtectContent: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  enableViewMembersCount: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  enableViewMembersList: PermissionLevel;

  // Messages
  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowPoll: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowMention: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSendText: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSendGIF: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSendSticker: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowReactionMessage: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendLink: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendImage: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendVideo: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendFile: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendVoice: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendAudio: PermissionLevel;

  // Comments
  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSendCommentText: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSendCommentGIF: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowSendCommentSticker: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  allowCommentReaction: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowCommentMention: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowCommentPoll: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendCommentLink: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendCommentImage: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendCommentVideo: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendCommentFile: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendCommentVoice: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.ADMINS })
  allowSendCommentAudio: PermissionLevel;

  @Prop()
  channelLink: string;
}
