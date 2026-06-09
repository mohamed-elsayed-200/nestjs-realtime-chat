import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PermissionDocument = HydratedDocument<Permission>;

@Schema({ timestamps: true })
export class Permission {
  @Prop({
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  })
  code: string;

  @Prop({ trim: true, type: String })
  bio?: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
