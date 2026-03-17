import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessageType } from '../../../types/enums';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  space: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender: Types.ObjectId;

  @Prop()
  text: string;

  @Prop({
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Prop()
  mediaUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo: Types.ObjectId;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
