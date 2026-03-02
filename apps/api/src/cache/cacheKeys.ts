export const CacheKeys = {
  exhibitions: () => 'exhibitions:all',
  accounts: () => 'accounts:all',
  profiles: () => 'profiles:all',
  userRoles: () => 'user_roles:all',
  services: (exhibitionId: string) => `services:${exhibitionId}`,
  stalls: (exhibitionId: string) => `stalls:${exhibitionId}`,
};

export const CacheTTL = {
  LONG: 300,   // 5 min
  SHORT: 120,  // 2 min
};
