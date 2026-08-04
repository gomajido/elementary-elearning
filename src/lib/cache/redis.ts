import { Redis } from "@upstash/redis";

// HTTP-based (not ioredis/TCP) — see RFC 0004: Cloudflare Workers has no
// reliable, well-supported path for raw Redis TCP, unlike Postgres (which
// has Hyperdrive). Module-level singleton — avoid constructing a new client
// per call, same pattern as getDb() in src/lib/db/index.ts.
let client: Redis | null = null;

function getRedisClient() {
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return client;
}

/**
 * Cache-aside: a hit returns immediately; a miss runs `compute()`, stores
 * the result, and returns it — so only the first call per `ttlSeconds`
 * window pays for `compute()`.
 *
 * Fails open on Redis errors specifically (unreachable, timeout): a cache
 * is a performance optimization, not a correctness dependency, so it falls
 * through to `compute()` directly rather than breaking the caller. Errors
 * from `compute()` itself are not caught here — they propagate normally.
 *
 * No manual JSON.stringify/parse — the client (de)serializes automatically.
 */
export async function cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  let redis: Redis | null = null;
  try {
    redis = getRedisClient();
    const hit = await redis.get<T>(key);
    if (hit !== null) return hit;
  } catch {
    redis = null;
  }

  const value = await compute();

  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch {
      // Best-effort — a failed cache write shouldn't fail the request.
    }
  }

  return value;
}
