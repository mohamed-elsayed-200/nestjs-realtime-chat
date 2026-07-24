import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ActivationStatus, SpaceTypes } from '../../../../types/enums';
import { SpaceSettings } from './settings/space-settings';
export type SpaceDocument = HydratedDocument<Space>;

@Schema({ timestamps: true })
export class Space {
  @Prop()
  name: string;

  @Prop()
  bio: string;

  @Prop()
  profileColor: string;

  @Prop({ default: 0 })
  membersCount: number;

  @Prop()
  avatar: string;

  @Prop()
  wallpaper: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  received?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contact' })
  receivedContact?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contact' })
  senderContact?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space' })
  parentSpace?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ActivationStatus,
    default: ActivationStatus.ACTIVE,
  })
  status: ActivationStatus;

  @Prop({ enum: SpaceTypes, default: SpaceTypes.PRIVATE })
  type: SpaceTypes;

  @Prop({ type: SpaceSettings })
  settings: SpaceSettings;
}

export const SpaceSchema = SchemaFactory.createForClass(Space);
SpaceSchema.index({ parentSpace: 1, type: 1 });
SpaceSchema.index({ status: 1 });
SpaceSchema.index({ senderContact: 1 });
SpaceSchema.index({ receivedContact: 1 });
SpaceSchema.index({ updatedAt: -1 });
SpaceSchema.index({ type: 1 });
SpaceSchema.index({ lastMessage: 1 });
SpaceSchema.index({ sender: 1 });
SpaceSchema.index({ received: 1 });
SpaceSchema.index(
  { 'settings.channel.channelLink': 1 },
  { unique: true, sparse: true },
);
SpaceSchema.index(
  { 'settings.group.groupLink': 1 },
  { unique: true, sparse: true },
);
SpaceSchema.index(
  { 'settings.community.communityLink': 1 },
  { unique: true, sparse: true },
);

SpaceSchema.index(
  { 'settings.channel.channelLink': 1, 'settings.group.groupLink': 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [
        { 'settings.channel.channelLink': { $exists: true, $ne: null } },
        { 'settings.group.groupLink': { $exists: true, $ne: null } },
        { 'settings.community.communityLink': { $exists: true, $ne: null } },
      ],
    },
  },
);
