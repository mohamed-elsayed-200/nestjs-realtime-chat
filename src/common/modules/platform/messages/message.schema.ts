import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
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

  @Prop({ type: Number })
  commentsCount: number;

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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  deletedFrom: Types.ObjectId[];

  @Prop()
  mimeType?: string;

  // Sticker specific fields
  @Prop()
  stickerPack?: string;

  @Prop()
  stickerId?: string;

  // GIF specific fields
  @Prop()
  gifId?: string;

  @Prop()
  gifPack?: string;

  // File fields
  @Prop()
  duration?: number;

  @Prop()
  audioLevels?: number;

  @Prop({ type: Number })
  viewCount: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ sender: 1, space: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ space: 1 });
