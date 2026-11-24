import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { isActiveMember } from "@/lib/social";

/**
 * Serves a member's uploaded photo to: the member, admins, active members (who see
 * each other in the app), and anyone holding that member's card code (a venue
 * scanning the QR on /verify).
 */
export async function GET(req: Request, ctx: RouteContext<"/api/photo/[id]">) {
  const { id } = await ctx.params;
  const code = new URL(req.url).searchParams.get("code");
  const user = await db.user.findUnique({ where: { id }, select: { photo: true, memberCode: true } });
  if (!user?.photo) return new Response("Not found", { status: 404 });

  let allowed = Boolean(code && user.memberCode && code === user.memberCode);
  if (!allowed) {
    const viewer = await getViewer();
    allowed = !!viewer && !viewer.suspended && (viewer.user.id === id || viewer.isAdmin || (await isActiveMember(viewer.user.id)));
  }
  if (!allowed) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(user.photo), {
    headers: {
      "Content-Type": "image/jpeg",
      // The URL changes whenever the photo does (?v=), so browsers may keep it.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
