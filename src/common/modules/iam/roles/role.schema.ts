import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ActivationStatus } from 'src/common/types/enums';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }] })
  permissions: mongoose.Types.ObjectId[];

  @Prop({
    enum: ActivationStatus,
    default: ActivationStatus.ACTIVE,
    index: true,
  })
  status: ActivationStatus;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
