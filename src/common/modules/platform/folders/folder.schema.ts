import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FolderDocument = HydratedDocument<Folder>;

@Schema({ timestamps: true })
export class Folder {
  @Prop({ required: true })
  name: string;

  @Prop()
  icon: string;

  @Prop()
  color: string;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);

FolderSchema.index({ user: 1, order: 1 });
