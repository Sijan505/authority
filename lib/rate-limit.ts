import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limit stored in Postgres, so it holds across server instances.
 * Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, ${windowStart})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start = ${windowStart} THEN rate_limits.count + 1 ELSE 1 END,
      window_start = ${windowStart}
    RETURNING count`;
  return (rows[0]?.count ?? 0) <= limit;
}

export function ipFromHeaders(h: Headers) {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function clientIp() {
  return ipFromHeaders(await headers());
}
