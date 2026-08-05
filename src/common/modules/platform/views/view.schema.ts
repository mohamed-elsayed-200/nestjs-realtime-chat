import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ViewTargetType } from '../../../../common/types/enums';

export type ViewDocument = HydratedDocument<View>;

@Schema({ timestamps: true })
export class View {
  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  target: Types.ObjectId;

  @Prop({
    type: String,
    enum: ViewTargetType,
    required: true,
  })
  targetType: ViewTargetType;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;
}

export const ViewSchema = SchemaFactory.createForClass(View);

ViewSchema.index(
  {
    target: 1,
    targetType: 1,
    user: 1,
  },
  { unique: true },
);
