import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BannedDocument = HydratedDocument<Banned>;

@Schema({ timestamps: true })
export class Banned {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  bannedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  bannedUser: Types.ObjectId;
}

export const BannedSchema = SchemaFactory.createForClass(Banned);

BannedSchema.index({ bannedBy: 1, bannedUser: 1 }, { unique: true });

BannedSchema.index({ bannedUser: 1 });
