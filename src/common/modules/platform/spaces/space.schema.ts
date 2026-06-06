import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ActivationStatus, SpaceTypes } from '../../../types/enums';

export type SpaceDocument = HydratedDocument<Space>;

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
  isContact: boolean;

  @Prop()
  avatar: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

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
}

export const SpaceSchema = SchemaFactory.createForClass(Space);
