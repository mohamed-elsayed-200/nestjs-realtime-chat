import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  ActivationStatus,
  AdminPermissionsPlatform,
} from '../../../../common/types/enums';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: [String],
    enum: AdminPermissionsPlatform,
    default: AdminPermissionsPlatform,
  })
  permissions: AdminPermissionsPlatform[];

  @Prop({
    enum: ActivationStatus,
    default: ActivationStatus.ACTIVE,
    index: true,
  })
  status: ActivationStatus;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
