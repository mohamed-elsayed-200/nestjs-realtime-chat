export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  NOT_VERIFIED = 'not-verified',
  BLOCKED = 'blocked',
  DELETED = 'deleted',
}
export enum UserType {
  ADMIN = 'admin',
  STAFF = 'staff',
  USER = 'user',
}
export enum OtpTypes {
  ACCOUNT_VERIFICATION = 'account-verification',
  PASSWORD_RECOVERY = 'password-recovery',
}
export enum ActivationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
export enum SpaceTypes {
  PRIVATE = 'private',
  GROUP = 'group',
  CHANNEL = 'channel',
  COMMUNITY = 'community',
}
export enum SpaceMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  VOICE = 'voice',
  FILE = 'file',
  GIF = 'gif',
  STICKER = 'sticker',
  LOTTIE = 'lottie',
  SYSTEM = 'system',
}
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'seen',
}

// space settings
export enum WhoCanSendMessages {
  EVERYONE = 'everyone',
  MEMBERS_ONLY = 'members-only',
  ADMINS_ONLY = 'admins-only',
}

export enum WhoCanAddMembers {
  EVERYONE = 'everyone',
  MEMBERS_ONLY = 'members-only',
  ADMINS_ONLY = 'admins-only',
}

export enum WhoCanChangeInfo {
  EVERYONE = 'everyone',
  ADMINS_ONLY = 'admins-only',
}

export enum WhoCanPinMessages {
  EVERYONE = 'everyone',
  ADMINS_ONLY = 'admins-only',
}

export enum WhoCanDeleteMessages {
  EVERYONE = 'everyone',
  ADMINS_ONLY = 'admins-only',
}

export enum JoinApproval {
  ANYONE_CAN_JOIN = 'anyone-can-join',
  NEED_APPROVAL = 'need-approval',
  INVITE_ONLY = 'invite-only',
}

export enum ChatHistory {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}
