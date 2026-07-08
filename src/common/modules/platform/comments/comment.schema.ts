import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CommentType } from '../../../../common/types/enums';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Space', index: true })
  space: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  message: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  author: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 2000 })
  text: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 2000 })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
  parent: Types.ObjectId | null;

  @Prop({ type: Number, default: 0, min: 0 })
  repliesCount: number;

  @Prop({ type: Boolean, default: false })
  isEdited: boolean;

  @Prop({ type: Date, default: null })
  editedAt: Date | null;

  @Prop({ required: true, enum: CommentType, default: CommentType.TEXT })
  commentType: CommentType;

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
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ message: 1, createdAt: -1 });
CommentSchema.index({ parent: 1, createdAt: 1 });
