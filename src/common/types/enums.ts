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
  BOT = 'bot',
}
export enum SpaceMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum SpaceMemberPermission {
  ADD_STORIES = 'post-stories',
  EDIT_STORIES = 'edit-stories',
  DELETE_STORIES = 'delete-stories',
  DELETE_MESSAGES = 'delete-messages',
  BAN_USERS = 'ban-users',
  INVITE_USERS_VIA_LINK = 'invite-users-via-link',
  PIN_MESSAGES = 'pin-messages',
  ADD_ADMIN = 'add-admin',
  CHANGE_SPACE_INFO = 'change-space-info',
  EDIT_MEMBER_TAGS = 'edit-member-tags',
  MANAGE_LIVE_STREAMS = 'manage-live-streams',
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
  LINK = 'link',
}
export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  SEEN = 'seen',
}

// space settings
export enum WhoCanSendMessages {
  EVERYONE = 'everyone',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanAddMembers {
  EVERYONE = 'everyone',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanChangeInfo {
  EVERYONE = 'everyone',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export enum WhoCanPinMessages {
  EVERYONE = 'everyone',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanComment {
  EVERYONE = 'everyone',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanDeleteMessages {
  EVERYONE = 'everyone',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export enum JoinApproval {
  ANYONE_CAN_JOIN = 'anyone-can-join',
  NEED_APPROVAL = 'need-approval',
  INVITE_ONLY = 'invite-only',
}

export enum SpaceHistory {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}
