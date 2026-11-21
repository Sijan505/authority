import "server-only";
import { unstable_rethrow } from "next/navigation";
import { copy } from "@/content/copy";
import { AccessError } from "@/lib/access";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/lib/validation";

/** Rate-limits by user (or IP) and converts access errors into a form message. */
export async function runAction(
  name: string,
  limit: { max: number; windowSeconds: number },
  fn: () => Promise<ActionState>,
  userId?: string,
): Promise<ActionState> {
  try {
    const key = `${name}:${userId ?? (await clientIp())}`;
    if (!(await rateLimit(key, limit.max, limit.windowSeconds))) {
      return { message: copy.errors.rate };
    }
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof AccessError) return { message: err.message };
    console.error(`[action:${name}]`, err);
    return { message: copy.errors.generic };
  }
}
