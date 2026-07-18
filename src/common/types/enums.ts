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
  ADMIN = 'admin',
  MEMBER = 'member',
  OWNER = 'owner',
}

export enum SpaceMemberPermission {
  // Member permissions
  REACTION_MESSAGES = 'reaction-messages',
  SEND_MESSAGES = 'send-messages',
  ADD_COMMENTS = 'add-comments',
  REACTION_COMMENTS = 'reaction-comments',
  SEND_PHOTOS = 'send-photos',
  SEND_VIDEOS = 'send-videos',
  SEND_AUDIOS = 'send-audios',
  SEND_FILES = 'send-files',
  SEND_VOICE = 'send-voice',
  SEND_STICKERS = 'send-stickers',
  SEND_GIFS = 'send-gifs',
  SEND_POLLS = 'send-polls',
  SEND_LINKS = 'send-links',
  INVITE_USERS = 'invite-users',

  // Moderation
  BAN_MEMBERS = 'ban-members',
  CHANGE_MEMBER_PERMISSIONS = 'change-member-permissions',
  ADD_ADMINS = 'add-admins',
  MANAGE_JOIN_REQUESTS = 'manage-join-requests',
  MANAGE_LIVE_STREAMS = 'manage-live-streams',
  CHANGE_SETTINGS = 'change-settings',
  CHANGE_INFO = 'change-info',
  PIN_ANY_MESSAGE = 'pin-any-message',
  DELETE_ANY_MESSAGE = 'delete-any-message',
  PIN_ANY_COMMENT = 'pin-any-comment',
  DELETE_ANY_COMMENT = 'delete-any-comment',
  ADD_STORIES = 'add-stories',
  EDIT_ANY_STORY = 'edit-any-story',
  DELETE_ANY_STORY = 'delete-any-story',
}

export const memberPermissionList: string[] = [
  SpaceMemberPermission.SEND_MESSAGES,
  SpaceMemberPermission.ADD_COMMENTS,
  SpaceMemberPermission.REACTION_MESSAGES,
  SpaceMemberPermission.REACTION_COMMENTS,
  SpaceMemberPermission.SEND_PHOTOS,
  SpaceMemberPermission.SEND_VIDEOS,
  SpaceMemberPermission.SEND_FILES,
  SpaceMemberPermission.SEND_AUDIOS,
  SpaceMemberPermission.SEND_VOICE,
  SpaceMemberPermission.SEND_STICKERS,
  SpaceMemberPermission.SEND_GIFS,
  SpaceMemberPermission.SEND_POLLS,
  SpaceMemberPermission.SEND_LINKS,
  SpaceMemberPermission.INVITE_USERS,
];
export const adminPermissionList: string[] = [
  SpaceMemberPermission.BAN_MEMBERS,
  SpaceMemberPermission.CHANGE_MEMBER_PERMISSIONS,
  SpaceMemberPermission.ADD_ADMINS,
  SpaceMemberPermission.MANAGE_JOIN_REQUESTS,
  SpaceMemberPermission.MANAGE_LIVE_STREAMS,
  SpaceMemberPermission.CHANGE_SETTINGS,
  SpaceMemberPermission.CHANGE_INFO,
  SpaceMemberPermission.PIN_ANY_MESSAGE,
  SpaceMemberPermission.DELETE_ANY_MESSAGE,
  SpaceMemberPermission.PIN_ANY_COMMENT,
  SpaceMemberPermission.DELETE_ANY_COMMENT,
  SpaceMemberPermission.ADD_STORIES,
  SpaceMemberPermission.EDIT_ANY_STORY,
  SpaceMemberPermission.DELETE_ANY_STORY,
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
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanAddMembers {
  EVERYBODY = 'everybody',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanChangeInfo {
  EVERYBODY = 'everybody',
  ADMIN = 'admin',
}

export enum WhoCanPinMessages {
  EVERYBODY = 'everybody',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum WhoCanComment {
  NOBODY = 'nobody',
  EVERYBODY = 'everybody',
  ADMIN = 'admin',
  MEMBER = 'member',
}
export enum PermissionLevel {
  NOBODY = 'nobody',
  EVERYBODY = 'everybody',
  ADMINS = 'admins',
  MEMBER = 'member',
}
export enum WhoCanDeleteMessages {
  EVERYBODY = 'everybody',
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
