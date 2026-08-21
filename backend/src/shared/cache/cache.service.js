/**
 * Enterprise Production-Grade In-Memory Cache Service
 * Features: Multi-tenant key scoping, Fail-Safe DB fallback, Cascade prefix invalidation, TTL management
 */
class CacheService {
  constructor() {
    this.cache = new Map();

    // Periodically clean up expired keys every 30 seconds
    this.cleanupInterval = setInterval(() => this._cleanupExpired(), 30000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Build tenant-isolated cache key
   * Format: [orgId]:[module]:[resource]:[scopeId]:[paramsHash]
   */
  buildKey({ orgId = "global", module, resource = "", scopeId = "", params = null }) {
    let paramsStr = "";
    if (params && typeof params === "object") {
      try {
        const sorted = Object.keys(params)
          .sort()
          .reduce((acc, k) => {
            if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
              acc[k] = params[k];
            }
            return acc;
          }, {});
        paramsStr = JSON.stringify(sorted);
      } catch {
        paramsStr = String(params);
      }
    } else if (params) {
      paramsStr = String(params);
    }

    const cleanOrg = orgId || "global";
    const cleanScope = scopeId ? `:${scopeId}` : "";
    const cleanRes = resource ? `:${resource}` : "";
    const cleanParam = paramsStr ? `:${paramsStr}` : "";

    return `${cleanOrg}:${module}${cleanRes}${cleanScope}${cleanParam}`;
  }

  /**
   * Fail-Safe Read / Fetch / Cache Wrapper
   * If cache read or write fails, executes fetchFn directly against DB.
   */
  async getOrSet(key, fetchFn, ttlSeconds = 120) {
    try {
      const cached = this.get(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch (err) {
      console.warn(`[CacheService] Read error for key "${key}", falling back to DB:`, err.message);
    }

    const data = await fetchFn();

    try {
      if (data !== null && data !== undefined) {
        this.set(key, data, ttlSeconds);
      }
    } catch (err) {
      console.warn(`[CacheService] Write error for key "${key}":`, err.message);
    }

    return data;
  }

  /**
   * Get raw cached value
   */
  get(key) {
    if (!this.cache.has(key)) return null;

    const item = this.cache.get(key);
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set cache entry with TTL
   */
  set(key, value, ttlSeconds = 120) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete specific key
   */
  del(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix
   */
  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate multiple prefixes at once (Cascade Invalidation)
   */
  invalidatePrefixes(prefixes = []) {
    for (const prefix of prefixes) {
      this.invalidatePrefix(prefix);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Cleanup helper
   */
  _cleanupExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
