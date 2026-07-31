import Redis from "ioredis";

// Module-level singleton — avoid opening a new connection per call, same
// pattern as getDb() in src/lib/db/index.ts.
let client: Redis | null = null;

function getRedisClient() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 1, connectTimeout: 1000 });
    // Without a listener, a connection error becomes an unhandled 'error'
    // event and crashes the process — cached() below handles failures itself.
    client.on("error", () => {});
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
 */
export async function cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  let redis: Redis | null = null;
  try {
    redis = getRedisClient();
    const hit = await redis.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch {
    redis = null;
  }

  const value = await compute();

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Best-effort — a failed cache write shouldn't fail the request.
    }
  }

  return value;
}
