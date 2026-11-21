import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

type Ctx = { params: Promise<{ nextauth: string[] }> };

/** Rate-limits the sign-in start and the OAuth callback per IP. */
async function limited(req: Request, ctx: Ctx) {
  const { nextauth } = await ctx.params;
  if (nextauth[0] === "signin" || nextauth[0] === "callback") {
    const ok = await rateLimit(`signin:${ipFromHeaders(req.headers)}`, 20, 10 * 60);
    if (!ok) return Response.redirect(new URL("/signin?error=rate", req.url), 303);
  }
  return handler(req, ctx);
}

export { limited as GET, limited as POST };
