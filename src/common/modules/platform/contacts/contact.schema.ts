import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContactDocument = HydratedDocument<Contact>;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true })
  name: string;

  @Prop()
  avatar: string;

  @Prop()
  profileColor: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  me: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  contact: Types.ObjectId;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

ContactSchema.index({ me: 1 });
ContactSchema.index({ contact: 1 });
ContactSchema.index({ name: 1 });
