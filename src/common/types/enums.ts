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
  // Member permissions
  SEND_MESSAGES = 'send-messages',
  ADD_COMMENTS = 'add-comments',
  REACTION_MESSAGES = 'reaction-messages',
  REACTION_COMMENTS = 'reaction-comments',
  SEND_PHOTOS = 'send-photos',
  SEND_VIDEOS = 'send-videos',
  SEND_FILES = 'send-files',
  SEND_VOICE = 'send-voice',
  SEND_STICKERS = 'send-stickers',
  SEND_GIFS = 'send-gifs',
  SEND_POLLS = 'send-polls',
  SEND_LINKS = 'send-links',
  INVITE_USERS = 'invite-users',

  // Moderation
  BAN_MEMBERS = 'ban-members',
  MANAGE_MEMBER_MESSAGES = 'manage-member-messages',
  MANAGE_MEMBER_COMMENTS = 'manage-member-comments',
  MANAGE_MEMBER_MEDIA = 'manage-member-media',
  MANAGE_JOIN_REQUESTS = 'manage-join-requests',
  MANAGE_ADMINS = 'manage-admins',
  MANAGE_SPACE_LIVE_STREAMS = 'manage-space-live-streams',
  CHANGE_SPACE_SETTINGS = 'change-space-settings',
  CHANGE_SPACE_INFO = 'change-space-info',
  PIN_SPACE_MESSAGES = 'pin-space-messages',
  DELETE_SPACE_MESSAGES = 'delete-space-messages',
  PIN_SPACE_COMMENTS = 'pin-space-comments',
  DELETE_SPACE_COMMENTS = 'delete-space-comments',
  ADD_SPACE_STORIES = 'add-space-stories',
  EDIT_ANY_SPACE_STORY = 'edit-any-space-story',
  DELETE_ANY_SPACE_STORY = 'delete-any-space-story',
}
export const memberPermissionList = [
  SpaceMemberPermission.SEND_MESSAGES,
  SpaceMemberPermission.ADD_COMMENTS,
  SpaceMemberPermission.REACTION_MESSAGES,
  SpaceMemberPermission.REACTION_COMMENTS,
  SpaceMemberPermission.SEND_PHOTOS,
  SpaceMemberPermission.SEND_VIDEOS,
  SpaceMemberPermission.SEND_FILES,
  SpaceMemberPermission.SEND_VOICE,
  SpaceMemberPermission.SEND_STICKERS,
  SpaceMemberPermission.SEND_GIFS,
  SpaceMemberPermission.SEND_POLLS,
  SpaceMemberPermission.SEND_LINKS,
  SpaceMemberPermission.INVITE_USERS,
];
export const adminPermissionList = [
  SpaceMemberPermission.BAN_MEMBERS,
  SpaceMemberPermission.MANAGE_MEMBER_MESSAGES,
  SpaceMemberPermission.MANAGE_MEMBER_COMMENTS,
  SpaceMemberPermission.MANAGE_MEMBER_MEDIA,
  SpaceMemberPermission.MANAGE_JOIN_REQUESTS,
  SpaceMemberPermission.MANAGE_ADMINS,
  SpaceMemberPermission.MANAGE_SPACE_LIVE_STREAMS,
  SpaceMemberPermission.CHANGE_SPACE_SETTINGS,
  SpaceMemberPermission.CHANGE_SPACE_INFO,
  SpaceMemberPermission.PIN_SPACE_MESSAGES,
  SpaceMemberPermission.DELETE_SPACE_MESSAGES,
  SpaceMemberPermission.PIN_SPACE_COMMENTS,
  SpaceMemberPermission.DELETE_SPACE_COMMENTS,
  SpaceMemberPermission.ADD_SPACE_STORIES,
  SpaceMemberPermission.EDIT_ANY_SPACE_STORY,
  SpaceMemberPermission.DELETE_ANY_SPACE_STORY,
];

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
