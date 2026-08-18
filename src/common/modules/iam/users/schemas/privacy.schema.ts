import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PrivacyValue } from 'src/common/types/enums';

@Schema({ _id: false })
export class UserPrivacy {
  @Prop({
    type: String,
    enum: Object.values(PrivacyValue),
    default: PrivacyValue.CONTACTS,
  })
  email: PrivacyValue;

  @Prop({
    type: String,
    enum: Object.values(PrivacyValue),
    default: PrivacyValue.EVERYBODY,
  })
  lastSeen: PrivacyValue;

  @Prop({
    type: String,
    enum: Object.values(PrivacyValue),
    default: PrivacyValue.EVERYBODY,
  })
  profilePhoto: PrivacyValue;

  @Prop({
    type: String,
    enum: Object.values(PrivacyValue),
    default: PrivacyValue.EVERYBODY,
  })
  forwardedMessages: PrivacyValue;

  @Prop({
    type: String,
    enum: Object.values(PrivacyValue),
    default: PrivacyValue.CONTACTS,
  })
  invite: PrivacyValue;
}

export const UserPrivacySchema = SchemaFactory.createForClass(UserPrivacy);
