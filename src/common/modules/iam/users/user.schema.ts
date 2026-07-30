import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserStatus, UserType } from '../../../../common/types/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ select: false, required: true, unique: true, index: true })
  email: string;

  @Prop({ unique: true, sparse: true })
  username: string;

  @Prop({ type: Date })
  dateOfBirth: Date;

  @Prop({ select: false, default: false })
  isAllowedChangePassword: boolean;

  @Prop({ select: false, required: true })
  password: string;

  @Prop({ default: false })
  is2FA: boolean;

  @Prop()
  avatar: string;

  @Prop()
  cover: string;

  @Prop()
  profileColor: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.NOT_VERIFIED,
    index: true,
  })
  status: UserStatus;

  @Prop({
    type: String,
    enum: UserType,
    default: UserType.USER,
    index: true,
  })
  userType: UserType;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    default: [],
  })
  roles: mongoose.Types.ObjectId[];

  @Prop()
  lastLoginAt: Date;

  @Prop()
  bio: string;

  @Prop({ type: Date, default: null })
  lastSeenAt: Date;
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ userType: 1 });
UserSchema.index({ lastSeenAt: 1 });

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    delete ret.password;
    return ret;
  },
});
