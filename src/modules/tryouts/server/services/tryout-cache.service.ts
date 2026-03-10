/**
 * Tryout-specific cache service.
 * Generic getCacheValue/setCacheValue are now in shared module.
 * This file keeps tryout-specific clearTryoutCache and re-exports shared utilities.
 */

// Re-export generic cache utilities from shared module
export { getCacheValue, setCacheValue } from "@/modules/shared/server/services/cache.service";
import { clearCacheByPrefix } from "@/modules/shared/server/services/cache.service";

/**
 * Clear tryout-specific in-memory cache entries.
 * Call after creating/updating/deleting a tryout.
 */
export const clearTryoutCache = (tryoutId?: string) => {
  clearCacheByPrefix("tryouts:list:");
  if (tryoutId) {
    clearCacheByPrefix(`tryout:full:${tryoutId}`);
    clearCacheByPrefix(`tryout:meta:${tryoutId}`);
  }
};
