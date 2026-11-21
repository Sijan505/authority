# Authority — Members Platform

Authority is a Nepal article publisher for fashion, hospitality and luxury. Members get its articles by field (industry), plus offers from partner venues, and Pro members can comment, post and see their field's member directory.

| Package | Price | Includes |
| --- | --- | --- |
| **Basic** | Free, starts automatically after onboarding, never expires | Articles, field home, offers and partner venues for your own field (read-only) |
| **Pro** | NPR 1,000 / month or NPR 9,600 / year (20% off 12,000) | Basic + comments, discussion feed, member directory in your field |

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 7 · NextAuth.js 4 (Google)

## Setup

Requires Node.js 20.19+ (22+ recommended) and PostgreSQL 14+.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # fill in the values (see below)
createdb authority          # or create the database in pgAdmin
npx prisma migrate dev      # creates the tables
npm run db:seed             # 9 fields, 6 sample articles, 2 sample offers
npm run dev                 # http://localhost:3000
```

Prisma 7 does not seed automatically after `migrate dev`, so run `npm run db:seed` once. It is safe to re-run.

Production: `npm run build` then `npm start`.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://USER:PASSWORD@HOST:5432/authority?schema=public` |
| `NEXTAUTH_SECRET` | Yes | Random string, at least 32 bytes. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | Yes | The site's public URL, e.g. `http://localhost:3000` or `https://authority.com.np` |
| `GOOGLE_CLIENT_ID` | Yes | From Google Cloud (below) |
| `GOOGLE_CLIENT_SECRET` | Yes | From Google Cloud (below) |
| `ADMIN_EMAILS` | Yes | Comma-separated Google emails that become admins on sign-in. Removing an email demotes that user at their next sign-in. |
| `NEXT_PUBLIC_ANALYTICS_ID` | No | GA4 ID (`G-…`). Empty = no analytics script. |

Only `NEXT_PUBLIC_ANALYTICS_ID` is exposed to the browser. Everything else stays on the server.

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create (or pick) a project.
2. **APIs & Services → OAuth consent screen**: choose **External**, enter the app name "Authority", support email and logo. Add scopes `openid`, `email`, `profile`. While in *Testing*, add your own Google accounts as test users; click **Publish app** when you go live.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**.
   - Authorised JavaScript origins: `http://localhost:3000` and your production URL.
   - Authorised redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://YOUR-DOMAIN/api/auth/callback/google`.
4. Copy the Client ID and Client secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## How it works

### Access rules (enforced on the server)

All checks live in [`lib/access.ts`](lib/access.ts) and run in every page, server action and API route; the UI only hides what the server would refuse anyway.

| | Public | Signed in, not onboarded | Basic (free) | Pro | Admin |
| --- | --- | --- | --- | --- | --- |
| Article titles + excerpts (all fields) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Full article body | | | own field | own field | all |
| Field home, offers, partner venues | | | own field | own field | |
| Comments (read + write) | | | | own field | moderate |
| Discussion feed, report, block | | | | own field | moderate |
| Member directory (names + fields) | | | | own field | |
| Admin panel | | | | | ✓ |

- **Basic** = any onboarded, non-suspended member. No payment or approval.
- **Pro** = a Pro subscription an admin has verified (`ACTIVE`), whose start date has passed and whose expiry date hasn't. Expiry is checked on every request, so when Pro ends the member drops back to Basic automatically. No cron job is needed.
- A **suspended** user has no access, can't use member actions and can't sign in.
- **Blocking** hides both members' Pro content from each other.
- Full article bodies are never sent to the browser unless the access check passes.
- The admin panel returns 404 for anyone who isn't an admin.

### Sign-in and onboarding

- Google sign-in creates the user record on first sign-in. `users.email` is unique, so one Google email = one account; a different Google account claiming the same email is refused.
- After first sign-in, members complete a 5-step onboarding (field; name, city, email/WhatsApp; perks; deposit signal; help build + contribution). Answers are stored in `applications`. Member pages redirect to onboarding until it's done. Finishing onboarding gives free Basic access straight away.

### Pro payment flow (no live gateway)

Basic is free, so payments are for Pro only.

1. Member opens **My field → Membership**, picks monthly or yearly, sees the amount (from `config/pricing.ts`, never from the browser) and the instructions for eSewa, Khalti or bank transfer.
2. Member pays outside the site, then submits the reference and/or a screenshot (JPG/PNG/WebP/PDF, ≤ 2 MB, stored in Postgres). Status becomes **Payment pending**. Only one pending payment at a time.
3. Admin verifies or rejects. Nothing is unlocked until then.

### How to verify a payment in admin

1. Sign in with an email listed in `ADMIN_EMAILS` and open **Admin → Payments**.
2. Each pending payment shows the member, package, amount, method, reference and a **View screenshot** link.
3. Check the money arrived (eSewa/Khalti merchant history or bank statement).
4. Optionally add a note, then click **Verify** or **Reject**.
   - **Verify** sets the Pro subscription to `ACTIVE` with a start date and expiry (monthly = 30 days, yearly = 365 days). A first Pro payment starts immediately; a renewal starts when the member's current Pro period ends.
   - **Reject** marks it rejected; the member sees your note and can resubmit.
5. Every verification/rejection is written to `audit_logs`.

Pro members see a renewal reminder on their dashboard from 7 days before Pro expires (`RENEWAL_REMINDER_DAYS` in `config/site.ts`).

### Admin panel

- **Dashboard**: sign-ups, members by field and city, pending payments, active Pro subscriptions.
- **Payments**: verify/reject with a note.
- **Articles**: create, edit, publish/unpublish, field and tags. Excerpt is public; body is members-only (plain text, blank line between paragraphs).
- **Offers**: partner venue offers per field (name, venue, discount text, validity, active).
- **Members**: search/filter, change field, move a Pro member to Basic (ends Pro now), suspend/reinstate. Pro is granted only by verifying a payment.
- **Moderation**: open reports with the reported text; remove content, remove + suspend the author, or dismiss.

Audit log entries are written for payment verification, admin role grants/revocations (from `ADMIN_EMAILS`), field/package/status changes and moderation actions.

### Rate limits

Stored in Postgres (`rate_limits`), so they work across server instances: sign-in 20 per 10 min per IP; onboarding 10 / 10 min; payments 5 / 10 min; comments, posts and blocks 20 / 5 min; reports 10 / 10 min. Change them in `app/api/auth/[...nextauth]/route.ts` and `app/actions/*.ts`.

## Changing prices, copy and TBC values

| What | Where |
| --- | --- |
| Pro prices (NPR) | `config/pricing.ts` → `proPrices`, `proYearlyFullPrice` |
| Package features | `config/pricing.ts` → `packages` |
| eSewa / Khalti IDs, bank details (TBC) | `config/pricing.ts` → `paymentMethods` |
| Contact email, launch date (TBC), Instagram, cities, perks, onboarding options | `config/site.ts` |
| All page text, FAQ answers (TBC), privacy note | `content/copy.ts` |
| Per-field theme: accent colour, hero text, featured label, offers heading, block order | `content/fields.ts` |
| Partner venues and offers | Admin → Offers (the 2 seeded offers are placeholders) |
| Articles | Admin → Articles (the 6 seeded articles are samples) |

Price changes apply to new payments only. Existing payments keep the amount they were created with.

Adding a new field: add it to `content/fields.ts` and run `npm run db:seed`.

## Data model

`users`, `fields`, `applications`, `subscriptions`, `payments`, `articles`, `comments`, `discussion_posts`, `reports`, `offers`, `audit_logs`, plus `user_blocks` (for block) and `rate_limits`. See [`prisma/schema.prisma`](prisma/schema.prisma).

## Deployment notes

- Any Node.js host works (Vercel, Railway, Render, a VPS). Use a managed PostgreSQL (Neon, Supabase, RDS, Railway).
- Set all environment variables on the host. Set `NEXTAUTH_URL` to the production URL and add the production redirect URI in Google Cloud.
- Run `npx prisma migrate deploy` on each deploy (not `migrate dev`), and `npm run db:seed` once.
- Behind a proxy or CDN, make sure `X-Forwarded-For` is passed through so rate limits see the real client IP.
- Payment screenshots are stored in the database; back up the database regularly.
- Publish the Google OAuth consent screen before launch, or only test users can sign in.

## Test checklist

- [ ] Google sign-in creates one account only (sign out and back in; check `users` has one row for the email).
- [ ] Onboarding saves all answers (check `applications` and Admin → Members).
- [ ] Finishing onboarding gives free Basic access to the member's own field.
- [ ] Basic user cannot see Pro features or other fields (no Discussion/Directory links; `/dashboard/discussion` redirects; other-field articles show the locked card; comment box absent).
- [ ] Pro user can comment only in own field (comment box appears on own-field articles only; posting to another field's article is refused by the server).
- [ ] Pro payment stays pending until admin verifies (still Basic while pending; Pro after Verify).
- [ ] Expired Pro subscription removes Pro access (set `expires_at` in the past in `subscriptions`; the member is back on Basic on the next request).
- [ ] Mobile, tablet and desktop layouts work.
