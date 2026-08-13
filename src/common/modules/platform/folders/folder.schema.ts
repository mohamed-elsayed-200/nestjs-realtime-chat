import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FolderDocument = HydratedDocument<Folder>;

@Schema({ timestamps: true })
export class Folder {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 'Folder' })
  icon: string;

  @Prop({ default: '#10AC84' })
  color: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Space' }], default: [] })
  spaces: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ default: false })
  isDefault: boolean;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);

FolderSchema.index({ createdBy: 1, order: 1 });
FolderSchema.index({ createdBy: 1, spaces: 1 });
