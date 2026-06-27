import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessageStatus, MessageType } from '../../../../types/enums';

export type DeletedMessageDocument = HydratedDocument<DeletedMessage>;

@Schema({ timestamps: true })
export class DeletedMessage {
  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  message: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space', index: true })
  space: Types.ObjectId;
}

export const DeletedMessageSchema =
  SchemaFactory.createForClass(DeletedMessage);

DeletedMessageSchema.index({ user: 1, space: 1 });
DeletedMessageSchema.index({ user: 1, message: 1 }, { unique: true });
