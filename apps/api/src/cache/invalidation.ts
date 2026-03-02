import { redis } from '../config/redis.js';
import { CacheKeys } from './cacheKeys.js';

export async function invalidateExhibitions() {
  await redis.del(CacheKeys.exhibitions()).catch(() => {});
}

export async function invalidateAccounts() {
  await redis.del(CacheKeys.accounts()).catch(() => {});
}

export async function invalidateProfiles() {
  await redis.del(CacheKeys.profiles()).catch(() => {});
}

export async function invalidateUserRoles() {
  await redis.del(CacheKeys.userRoles()).catch(() => {});
}

export async function invalidateServices(exhibitionId: string) {
  await redis.del(CacheKeys.services(exhibitionId)).catch(() => {});
}

export async function invalidateStalls(exhibitionId: string) {
  await redis.del(CacheKeys.stalls(exhibitionId)).catch(() => {});
}
