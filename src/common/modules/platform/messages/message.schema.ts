import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Mongoose, Types } from 'mongoose';
import { MessageStatus, MessageType } from '../../../types/enums';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Space', index: true })
  space: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender?: Types.ObjectId;

  @Prop({ required: true, enum: MessageType, default: MessageType.TEXT })
  messageType: MessageType;

  @Prop({ required: true, enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Prop({ type: String, trim: true })
  content: string;

  @Prop({ type: String, trim: true })
  text: string;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  replyTo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  forwardFrom?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  albumFiles?: string[];

  @Prop({ default: false })
  isPinned?: boolean;

  @Prop({ default: false })
  isEdited?: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;

  @Prop()
  mimeType?: string;

  // Sticker specific fields
  @Prop()
  stickerPack?: string;

  @Prop()
  stickerId?: string;

  @Prop({ default: false })
  isLottie?: boolean;

  // GIF specific fields
  @Prop()
  gifId?: string;

  @Prop()
  gifPack?: string;

  // File fields
  @Prop()
  duration?: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
