import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PrivateSettings {
  @Prop({ default: false })
  secretSpace: boolean;

  @Prop({ default: 0 })
  autoDeleteDuration: number;

  @Prop({ default: false })
  disappearingMessages: boolean;
}
