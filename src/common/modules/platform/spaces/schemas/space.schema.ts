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
  description: string;

  @Prop()
  profileColor: string;

  @Prop({ default: 0 })
  membersCount: number;

  @Prop()
  avatar: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({
    type: {
      _id: Types.ObjectId,
      name: String,
      avatar: String,
      username: String,
      profileColor: String,
      isContact: String,
      contactName: String,
      contactProfileColor: String,
      contactAvatar: String,
    },
  })
  received?: {
    _id: Types.ObjectId;
    name: String;
    avatar: String;
    username: String;
    profileColor: String;
    isContact: String;
    contactName: String;
    contactProfileColor: String;
    contactAvatar: String;
  };

  @Prop({
    type: {
      _id: Types.ObjectId,
      name: String,
      avatar: String,
      username: String,
      profileColor: String,
      isContact: String,
      contactName: String,
      contactProfileColor: String,
      contactAvatar: String,
    },
  })
  sender?: {
    _id: Types.ObjectId;
    name: String;
    avatar: String;
    username: String;
    profileColor: String;
    isContact: String;
    contactName: String;
    contactProfileColor: String;
    contactAvatar: String;
  };

  @Prop({
    type: {
      _id: Types.ObjectId,
      text: String,
      sender: Types.ObjectId,
      createdAt: Date,
    },
  })
  lastMessage?: {
    _id: Types.ObjectId;
    text: string;
    sender: Types.ObjectId;
    createdAt: Date;
  };

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

SpaceSchema.index({
  status: 1,
  updatedAt: -1,
});

SpaceSchema.index({
  type: 1,
});

SpaceSchema.index({
  'lastMessage.createdAt': -1,
});
