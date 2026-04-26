import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessageStatus, MessageType } from '../../../types/enums';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Space', index: true, required: true })
  space: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ default: null })
  text: string;

  @Prop({
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType: MessageType;

  @Prop({ default: null })
  mediaUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  replyTo: Types.ObjectId;

  @Prop({
    type: Object,
    default: {},
  })
  metadata: {
    fileName?: string;
    size?: number;
    duration?: number;
    width?: number;
    height?: number;
  };

  @Prop({
    type: String,
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Prop({
    type: Boolean,
  })
  isEdited: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
