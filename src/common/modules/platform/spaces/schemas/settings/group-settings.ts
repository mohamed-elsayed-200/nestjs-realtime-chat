import { Prop, Schema } from '@nestjs/mongoose';
import {
  SpaceHistory,
  JoinApproval,
  WhoCanAddMembers,
  WhoCanChangeInfo,
  WhoCanDeleteMessages,
  WhoCanPinMessages,
  WhoCanSendMessages,
} from '../../../../../../common/types/enums';

@Schema({ _id: false })
export class GroupSettings {
  @Prop({ enum: JoinApproval, default: JoinApproval.ANYONE_CAN_JOIN })
  joinApproval: JoinApproval;

  @Prop({ enum: SpaceHistory, default: SpaceHistory.VISIBLE })
  spaceHistory: SpaceHistory;

  @Prop({ default: false })
  isSubscriptionRequired: boolean;

  @Prop({ default: true })
  allowCustomNotifications: boolean;

  @Prop({ default: true })
  allowMentions: boolean;

  @Prop({ default: false })
  enablePolls: boolean;

  @Prop({ default: 0 })
  maxMembers: number;

  @Prop({ default: 0 })
  messageExpiryDuration: number;

  @Prop({ enum: WhoCanSendMessages, default: WhoCanSendMessages.EVERYONE })
  whoCanSendMessages: WhoCanSendMessages;

  @Prop({ enum: WhoCanAddMembers, default: WhoCanAddMembers.ADMIN })
  whoCanAddMembers: WhoCanAddMembers;

  @Prop({ enum: WhoCanChangeInfo, default: WhoCanChangeInfo.ADMIN })
  whoCanChangeInfo: WhoCanChangeInfo;

  @Prop({ enum: WhoCanPinMessages, default: WhoCanPinMessages.ADMIN })
  whoCanPinMessages: WhoCanPinMessages;

  @Prop({
    enum: WhoCanDeleteMessages,
    default: WhoCanDeleteMessages.ADMIN,
  })
  whoCanDeleteMessages: WhoCanDeleteMessages;

  @Prop({ default: false })
  hideMembersList: boolean;

  @Prop({ default: false })
  hideMembersCount: boolean;

  @Prop({ default: false })
  restrictSendingUrls: boolean;

  @Prop({ default: false })
  restrictSendingMedia: boolean;

  @Prop({ default: false })
  restrictSendingStickers: boolean;

  @Prop({ default: false })
  slowModeEnabled: boolean;

  @Prop({ default: 0 })
  slowModeDelay: number;

  @Prop({ default: false })
  enableSlowModeWarning: boolean;

  @Prop({ default: false })
  enableVoiceSpace: boolean;

  @Prop({ default: null })
  groupLink: string;

  @Prop({ default: true })
  enableReactions: boolean;
}
