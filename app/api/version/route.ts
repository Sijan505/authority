/** The live deployment's id, so an open app can tell a newer version has been deployed. */
export async function GET() {
  return Response.json({ id: process.env.VERCEL_DEPLOYMENT_ID ?? "dev" }, { headers: { "Cache-Control": "no-store" } });
}
