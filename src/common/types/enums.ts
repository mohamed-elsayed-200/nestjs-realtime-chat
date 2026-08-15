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
  ADD_SPACES_IN_COMMUNITY = 'add-spaces-community',
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
  SpaceMemberPermission.ADD_SPACES_IN_COMMUNITY,
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
  CALL_ENDED = 'call-ended',
  CALL_REJECTED = 'call-rejected',
  CALL_MISSED = 'call-missed',
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

export enum SocketEvents {
  // User
  USER_LOGOUT = 'user:logout',

  // Views
  VIEW_MESSAGE = 'view:message',
  VIEWED_MESSAGE = 'viewed:message',

  // Messages
  MESSAGE_SEND = 'message:send',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_NEW = 'message:new',
  MESSAGE_DELETE = 'message:delete',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_EDIT = 'message:edit',
  MESSAGE_EDITED = 'message:edited',
  MESSAGE_TYPING = 'message:typing',
  MESSAGE_FORWARD = 'message:forward',
  MESSAGE_PIN = 'message:pin',
  MESSAGE_PINNED = 'message:pinned',
  MESSAGE_REACTION = 'message:reaction',
  MESSAGE_REACTED = 'message:reacted',

  // Spaces
  SPACE_JOIN = 'space:join',
  SPACE_JOINED = 'space:joined',
  SPACE_LEAVE = 'space:leave',
  SPACE_LEFT = 'space:left',
  SPACE_INFO_UPDATE = 'space:info-update',
  SPACE_INFO_UPDATED = 'space:info-updated',
  SPACE_READ = 'space:read',
  SPACE_READABLE = 'space:readable',
  SPACE_DELETE = 'space:delete',
  SPACE_DELETED = 'space:deleted',
  SPACE_CHANGE_WALLPAPER = 'space:change-wallpaper',
  SPACE_WALLPAPER_CHANGED = 'space:wallpaper-changed',

  // Members
  MEMBER_ADD = 'member:add',
  MEMBER_ADDED = 'member:added',
  MEMBER_REMOVE = 'member:remove',
  MEMBER_REMOVED = 'member:removed',
  MEMBER_PROMOTE_ADMIN = 'member:promote-admin',
  MEMBER_ADMIN_PROMOTED = 'member:admin-promoted',
  MEMBER_DISMISS_ADMIN = 'member:dismiss-admin',
  MEMBER_ADMIN_DISMISSED = 'member:admin-dismissed',
  MEMBER_UPDATE_ADMIN_PERMISSIONS = 'member:update-admin-permissions',
  MEMBER_ADMIN_PERMISSIONS_UPDATED = 'member:admin-permissions-updated',
  MEMBER_UPDATE_PERMISSIONS = 'member:update-permissions',
  MEMBER_PERMISSIONS_UPDATED = 'member:permissions-updated',
  MEMBER_TRANSFER_OWNERSHIP = 'member:transfer-ownership',
  MEMBER_OWNERSHIP_TRANSFERRED = 'member:ownership-transferred',
  MEMBER_TOGGLE_BAN = 'member:toggle-ban',

  // Presence
  PRESENCE_SUBSCRIBE = 'presence:subscribe',
  PRESENCE_UNSUBSCRIBE = 'presence:unsubscribe',
  PRESENCE_USER_ONLINE = 'presence:user:online',
  PRESENCE_USER_OFFLINE = 'presence:user:offline',
  PRESENCE_ONLINE_SESSIONS = 'presence:online:sessions',

  // Calls
  CALL_START = 'call:start',
  CALL_RINGING = 'call:ringing',
  CALL_ACCEPT = 'call:accept',
  CALL_ACCEPTED = 'call:accepted',
  CALL_REJECT = 'call:reject',
  CALL_REJECTED = 'call:rejected',
  CALL_JOIN = 'call:join',
  CALL_JOINED = 'call:joined',
  CALL_LEAVE = 'call:leave',
  CALL_LEFT = 'call:left',
  CALL_END = 'call:end',
  CALL_ENDED = 'call:ended',
  CALL_SYNC = 'call:sync',
  CALL_MESSAGE_SEND = 'call:message:send',
  CALL_MESSAGE_SENT = 'call:message:sent',
  CALL_MESSAGE_NEW = 'call:message:new',
  CALL_MESSAGE_DELETE = 'call:message:delete',
  CALL_MESSAGE_DELETED = 'call:message:deleted',
  CALL_MESSAGE_EDIT = 'call:message:edit',
  CALL_MESSAGE_EDITED = 'call:message:edited',
  CALL_MESSAGE_TYPING = 'call:message:typing',
  CALL_MESSAGE_FORWARD = 'call:message:forward',
  CALL_MESSAGE_PIN = 'call:message:pin',
  CALL_MESSAGE_PINNED = 'call:message:pinned',
  CALL_MESSAGE_REACTION = 'call:message:reaction',
  CALL_MESSAGE_REACTED = 'call:message:reacted',
  CALL_TOGGLE_MUTE = 'call:toggle:mute',
  CALL_TOGGLE_RAISE_HAND = 'call:toggle:raise:hand',
  CALL_PARTICIPANT_UPDATED = 'call:participant:updated',
  CALL_UPDATE_SETTINGS = 'call:update:settings',
  CALL_SETTINGS_UPDATED = 'call:settings-updated',

  // Webrtc
  WEBRTC_OFFER = 'webrtc:offer',
  WEBRTC_ANSWER = 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE = 'webrtc:ice-candidate',
  SCREEN_SHARE_STARTED = 'call:screen-share-started',
  SCREEN_SHARE_STOPPED = 'call:screen-share-stopped',

  // Banned
  BAN_TOGGLE = 'ban:toggle',
  BAN_TOGGLED = 'ban:toggled',
}

export enum ViewTargetType {
  MESSAGE = 'Message',
  POST = 'Post',
  STORY = 'Story',
  COMMENT = 'Comment',
}

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum CallScope {
  PRIVATE = 'private',
  CHANNEL = 'channel',
  GROUP = 'group',
  COMMUNITY = 'community',
}

export enum ParticipantStatus {
  INVITED = 'invited',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  REJECTED = 'rejected',
  LEFT = 'left',
  MUTED = 'muted',
  WAITING = 'waiting',
  RAISED_HAND = 'raised_hand',
  SPEAKING = 'speaking',
  PRESENTER = 'presenter',
}

export enum CallParticipantRole {
  HOST = 'host',
  CO_HOST = 'co_host',
  SPEAKER = 'speaker',
  PRESENTER = 'presenter',
  LISTENER = 'listener',
  RAISED_HAND = 'raised_hand',
}
