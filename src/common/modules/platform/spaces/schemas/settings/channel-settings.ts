import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  SpaceHistory,
  JoinApproval,
  WhoCanComment,
} from '../../../../../types/enums';

@Schema({ _id: false })
export class ChannelSettings {
  @Prop({ enum: JoinApproval, default: JoinApproval.ANYONE_CAN_JOIN })
  joinApproval: JoinApproval;

  @Prop({ enum: SpaceHistory, default: SpaceHistory.VISIBLE })
  spaceHistory: SpaceHistory;

  @Prop({ default: false })
  isSubscriptionRequired: boolean;

  @Prop({ default: true })
  enableReactions: boolean;

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

  @Prop({ default: false })
  addSignature: boolean;

  @Prop({ default: false })
  hideSubscribersCount: boolean;

  @Prop({ default: false })
  protectContent: boolean;

  @Prop({ default: false })
  enableComments: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Space' })
  linkedDiscussionGroup: Types.ObjectId;

  @Prop({ enum: WhoCanComment, default: WhoCanComment.EVERYONE })
  whoCanComment: WhoCanComment;

  @Prop({ default: false })
  commentsRestrictUrls: boolean;

  @Prop({ default: false })
  commentsRestrictMedia: boolean;

  @Prop({ default: false })
  commentsRestrictStickers: boolean;

  @Prop()
  channelLink: string;
}
