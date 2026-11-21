import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";

/** Serves a payment screenshot to admins, or to the member who uploaded it. */
export async function GET(_req: Request, ctx: RouteContext<"/api/payments/[id]/screenshot">) {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer) return new Response("Not found", { status: 404 });

  const payment = await db.payment.findUnique({
    where: { id },
    select: { userId: true, screenshot: true, screenshotType: true },
  });
  if (!payment?.screenshot || (!viewer.isAdmin && payment.userId !== viewer.user.id)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Buffer.from(payment.screenshot), {
    headers: {
      "Content-Type": payment.screenshotType ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Uploaded files can't run scripts even if opened directly.
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
