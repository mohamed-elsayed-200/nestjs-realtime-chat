import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  JoinApproval,
  PermissionLevel,
} from '../../../../../../common/types/enums';

@Schema({ _id: false })
export class CommunityCategory {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  position: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Space' }], default: [] })
  spaces: Types.ObjectId[];
}

export const CommunityCategorySchema =
  SchemaFactory.createForClass(CommunityCategory);

@Schema({ _id: false })
export class CommunitySettings {
  @Prop({ unique: true, sparse: true })
  communityLink: string;

  @Prop({ enum: JoinApproval, default: JoinApproval.ANYONE_CAN_JOIN })
  joinApproval: JoinApproval;

  @Prop({ default: 0 })
  maxMembers: number;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  enableViewMembersCount: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  enableViewMembersList: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  enableViewChannelsCount: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  enableViewChannelsList: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  enableViewGroupsCount: PermissionLevel;

  @Prop({ enum: PermissionLevel, default: PermissionLevel.EVERYBODY })
  enableViewGroupsList: PermissionLevel;

  @Prop({ type: [CommunityCategorySchema], default: [] })
  categories: CommunityCategory[];
}

export const CommunitySettingsSchema =
  SchemaFactory.createForClass(CommunitySettings);
