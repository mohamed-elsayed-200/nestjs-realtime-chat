import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ActivationStatus } from '../../../../common/types/enums';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true })
export class Session {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: string;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: String })
  userAgent: string;

  @Prop({ type: Object })
  location: {
    country?: string;
    city?: string;
    lat?: number;
    lon?: number;
  };

  @Prop({
    enum: ActivationStatus,
    default: ActivationStatus.ACTIVE,
    index: true,
  })
  status: ActivationStatus;

  @Prop({ type: Date })
  expiresIn: Date;

  @Prop({ type: Date, default: Date.now })
  lastUsedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
