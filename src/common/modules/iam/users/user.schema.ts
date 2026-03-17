import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserStatus, UserType } from 'src/common/types/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ select: false })
  phone: string;

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

  @Prop()
  headline: string;

  @Prop()
  country: string;

  @Prop({ type: Number, default: 0 })
  accountBalance: 0;

  @Prop({
    _id: false,
    type: {
      city: String,
      state: String,
      lat: Number,
      lng: Number,
    },
  })
  location: {
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };

  @Prop({
    _id: false,
    type: {
      website: String,
      linkedin: String,
      github: String,
      twitter: String,
      facebook: String,
    },
    default: {
      website: '',
      linkedin: '',
      github: '',
      twitter: '',
      facebook: '',
    },
  })
  socialLinks?: {
    website?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
    facebook?: string;
  };

  @Prop({ type: String })
  lastPasswordChangedAt: Date;

  @Prop({ type: String })
  lastIp: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  createdBy?: mongoose.Types.ObjectId;
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ type: 1 });
UserSchema.index({ 'country.code': 1 });

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    delete ret.password;
    return ret;
  },
});
