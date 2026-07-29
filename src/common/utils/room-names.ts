export const RoomNames = {
  user: (userId: string) => `user:${userId}`,
  space: (spaceId: string) => `space:${spaceId}`,
  community: (communityId: string) => `community:${communityId}`,
} as const;
