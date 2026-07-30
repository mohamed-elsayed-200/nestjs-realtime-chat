export const RoomNames = {
  user: (userId: string) => `user:${userId}`,
  space: (spaceId: string) => `space:${spaceId}`,
  session: (sessionKey: string) => `session:${sessionKey}`,
  community: (communityId: string) => `community:${communityId}`,
} as const;
