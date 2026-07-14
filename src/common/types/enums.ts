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
  // Messages
  SEND_MESSAGES = 'send-messages',
  EDIT_OWN_MESSAGES = 'edit-own-messages',
  DELETE_OWN_MESSAGES = 'delete-own-messages',
  DELETE_ANY_MESSAGES = 'delete-any-messages',
  PIN_MESSAGES = 'pin-messages',

  // Comments
  ADD_COMMENTS = 'add-comments',
  EDIT_OWN_COMMENTS = 'edit-own-comments',
  DELETE_OWN_COMMENTS = 'delete-own-comments',
  DELETE_ANY_COMMENTS = 'delete-any-comments',

  // Reactions
  REACTION_MESSAGES = 'reaction-messages',
  REACTION_COMMENTS = 'reaction-comments',

  // Media
  SEND_PHOTOS = 'send-photos',
  SEND_VIDEOS = 'send-videos',
  SEND_FILES = 'send-files',
  SEND_VOICE = 'send-voice',
  SEND_STICKERS = 'send-stickers',
  SEND_GIFS = 'send-gifs',
  SEND_POLLS = 'send-polls',
  SEND_LINKS = 'send-links',

  // Stories
  ADD_STORIES = 'add-stories',
  EDIT_STORIES = 'edit-stories',
  DELETE_STORIES = 'delete-stories',
  PIN_STORIES = 'pin-stories',

  // Live
  MANAGE_LIVE_STREAMS = 'manage-live-streams',

  // Members
  INVITE_USERS = 'invite-users',
  APPROVE_JOIN_REQUESTS = 'approve-join-requests',

  // Moderation
  RESTRICT_MEMBERS = 'restrict-members',
  BAN_MEMBERS = 'ban-members',
  MANAGE_ADMINS = 'manage-admins',
  EDIT_MEMBER_TAGS = 'edit-member-tags',

  // Space
  CHANGE_SETTINGS = 'change-settings',
  CHANGE_PHOTO = 'change-photo',
  CHANGE_USERNAME = 'change-username',
  CHANGE_BIO = 'change-bio',
  CHANGE_NAME = 'change-name',
  CHANGE_PERMISSIONS = 'change-permissions',
}

export enum CommentType {
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
  EVERYBODY = 'everybody',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanAddMembers {
  EVERYBODY = 'everybody',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanChangeInfo {
  EVERYBODY = 'everybody',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export enum WhoCanPinMessages {
  EVERYBODY = 'everybody',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanComment {
  NOBODY = 'nobody',
  EVERYBODY = 'everybody',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanDeleteMessages {
  EVERYBODY = 'everybody',
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
