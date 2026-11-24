import { getViewer } from "@/lib/access";
import { socialCounts } from "@/lib/social";

/** Unread messages, pending requests and unread notifications, for the app's tab badges. */
export async function GET() {
  const viewer = await getViewer();
  const counts = viewer && !viewer.suspended ? await socialCounts(viewer.user.id) : { messages: 0, requests: 0, notifications: 0 };
  return Response.json(counts, { headers: { "Cache-Control": "private, no-store" } });
}
