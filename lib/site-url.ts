/**
 * The site's public address, for links that leave the page: QR codes, share links and
 * link previews. NEXTAUTH_URL if set, else the production domain Vercel provides
 * (VERCEL_PROJECT_PRODUCTION_URL), else this deployment's own URL, else localhost.
 */
export function siteUrl() {
  const explicit = process.env.NEXTAUTH_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return (explicit ?? (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
}
