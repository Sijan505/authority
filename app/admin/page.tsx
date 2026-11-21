import Link from "next/link";
import { depositOptions, helpOptions, perks } from "@/config/site";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { BarList, DailyBars } from "./charts";

const TZ = "Asia/Kathmandu";
const DAY = 86_400_000;
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
const npr = (n: number) => `NPR ${n.toLocaleString("en-IN")}`;

export default async function AdminDashboard() {
  await requireAdmin();
  const now = new Date();
  const since7 = new Date(now.getTime() - 7 * DAY);
  const since14 = new Date(now.getTime() - 14 * DAY);
  const since30 = new Date(now.getTime() - 30 * DAY);
  const activePro = { package: "PRO" as const, status: "ACTIVE" as const, startsAt: { lte: now }, expiresAt: { gt: now } };

  const [
    totalUsers,
    onboarded,
    new7,
    newPrev7,
    proActive,
    proPending,
    pendingPayments,
    openReports,
    suspended,
    revenue30,
    daily,
    byField,
    byCity,
    fields,
    deposit,
    helpBuild,
    perkRows,
    comments30,
    posts30,
    published,
    recent,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { onboardedAt: { not: null } } }),
    db.user.count({ where: { createdAt: { gte: since7 } } }),
    db.user.count({ where: { createdAt: { gte: since14, lt: since7 } } }),
    db.user.count({ where: { subscriptions: { some: activePro } } }),
    db.subscription.count({ where: { package: "PRO", status: "PENDING_PAYMENT" } }),
    db.payment.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.user.count({ where: { status: "SUSPENDED" } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "VERIFIED", verifiedAt: { gte: since30 } } }),
    db.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM users WHERE created_at >= ${since30} GROUP BY 1`,
    db.user.groupBy({ by: ["fieldId"], _count: { _all: true }, where: { onboardedAt: { not: null } } }),
    db.user.groupBy({ by: ["city"], _count: { _all: true }, where: { onboardedAt: { not: null } } }),
    db.field.findMany({ orderBy: { position: "asc" } }),
    db.application.groupBy({ by: ["deposit"], _count: { _all: true } }),
    db.application.groupBy({ by: ["helpBuild"], _count: { _all: true } }),
    db.$queryRaw<{ perk: string; n: number }[]>`
      SELECT unnest(perks) AS perk, count(*)::int AS n FROM applications GROUP BY 1`,
    db.comment.count({ where: { createdAt: { gte: since30 }, removedAt: null } }),
    db.discussionPost.count({ where: { createdAt: { gte: since30 }, removedAt: null } }),
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, city: true, createdAt: true, onboardedAt: true, status: true, field: { select: { name: true } } },
    }),
  ]);

  // 30 days of sign-ups, zero-filled, in Nepal time.
  const dailyMap = new Map(daily.map((r) => [r.day, r.n]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = dayKey(new Date(now.getTime() - (29 - i) * DAY));
    return { date, count: dailyMap.get(date) ?? 0 };
  });
  const signups30 = days.reduce((s, d) => s + d.count, 0);

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const trend = new7 - newPrev7;
  const fieldCount = new Map(byField.map((r) => [r.fieldId, r._count._all]));
  const depositMap = new Map(deposit.map((r) => [r.deposit, r._count._all]));
  const helpMap = new Map(helpBuild.map((r) => [r.helpBuild, r._count._all]));
  const perkMap = new Map(perkRows.map((r) => [r.perk, r.n]));
  const applications = deposit.reduce((s, r) => s + r._count._all, 0);

  const stats = [
    { label: "Total members", value: totalUsers.toLocaleString(), note: `${onboarded} finished setup (${pct(onboarded, totalUsers)}%)` },
    {
      label: "New this week",
      value: new7.toLocaleString(),
      note: trend === 0 ? "Same as last week" : `${trend > 0 ? "▲" : "▼"} ${Math.abs(trend)} vs last week`,
    },
    { label: "Active Pro", value: proActive.toLocaleString(), note: `${pct(proActive, onboarded)}% of set-up members` },
    { label: "Verified revenue, 30 days", value: npr(revenue30._sum.amount ?? 0), note: "From verified Pro payments" },
  ];

  const attention = [
    { label: "Payments waiting for approval", value: pendingPayments, href: "/admin/payments" },
    { label: "Open reports to moderate", value: openReports, href: "/admin/moderation" },
    { label: "Suspended members", value: suspended, href: "/admin/members" },
  ];

  const funnel = [
    { label: "Signed in with Google", value: totalUsers },
    { label: "Finished setup (Basic)", value: onboarded },
    { label: "Started Pro (payment sent or pending)", value: proPending + proActive },
    { label: "Active Pro", value: proActive },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium text-brown">Dashboard</h1>
          <p className="mt-1 text-base text-ink">
            Members, approvals and activity. Times in Nepal time. Updated on every visit.
          </p>
        </div>
        <a href="https://vercel.com/sijan-taazaresort/authority/analytics" target="_blank" rel="noreferrer" className="btn-ghost text-base">
          Website traffic ↗
        </a>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="card">
            <p className="text-sm uppercase tracking-[0.15em] text-gold-dark">{s.label}</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-brown">{s.value}</p>
            <p className="mt-1 text-sm text-ink">{s.note}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="attention" className="mt-8 card">
        <h2 id="attention" className="text-2xl font-medium text-brown">
          Needs attention
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {attention.map((a) => (
            <li key={a.label}>
              <Link
                href={a.href}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition hover:border-gold-dark ${
                  a.value > 0 ? "border-gold-dark bg-gold/10" : "border-gold/30"
                }`}
              >
                <span className="text-base text-brown">{a.label}</span>
                <span className="text-2xl font-semibold tabular-nums text-brown">{a.value}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="signups" className="mt-8 card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="signups" className="text-2xl font-medium text-brown">
            Sign-ups per day
          </h2>
          <p className="text-base text-ink">{signups30} in the last 30 days</p>
        </div>
        <div className="mt-4">
          <DailyBars days={days} label={`Daily sign-ups over the last 30 days, ${signups30} in total`} />
        </div>
      </section>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="funnel" className="card">
          <h2 id="funnel" className="text-2xl font-medium text-brown">
            Member journey
          </h2>
          <p className="hint">How far members get, out of everyone who signed in.</p>
          <BarList rows={funnel} total={totalUsers} empty="No members yet." />
        </section>

        <section aria-labelledby="activity" className="card">
          <h2 id="activity" className="text-2xl font-medium text-brown">
            Activity, last 30 days
          </h2>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            {[
              ["Comments", comments30],
              ["Discussion posts", posts30],
              ["Published articles", published],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-gold/30 px-2 py-3">
                <dt className="text-sm text-ink">{k}</dt>
                <dd className="text-3xl font-semibold tabular-nums text-brown">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink">Published articles is the all-time total.</p>
        </section>

        <section aria-labelledby="by-field" className="card">
          <h2 id="by-field" className="text-2xl font-medium text-brown">
            Members by field
          </h2>
          <BarList rows={fields.map((f) => ({ label: f.name, value: fieldCount.get(f.id) ?? 0 }))} total={onboarded} empty="No members have finished setup yet." />
        </section>

        <section aria-labelledby="by-city" className="card">
          <h2 id="by-city" className="text-2xl font-medium text-brown">
            Members by city
          </h2>
          <BarList
            rows={byCity.map((c) => ({ label: c.city ?? "Not set", value: c._count._all })).sort((a, b) => b.value - a.value)}
            total={onboarded}
            empty="No members have finished setup yet."
          />
        </section>
      </div>

      <section aria-labelledby="signals" className="mt-8 card">
        <h2 id="signals" className="text-2xl font-medium text-brown">
          Founding-member signals
        </h2>
        <p className="hint">Answers from the setup questions, across {applications} member{applications === 1 ? "" : "s"}.</p>
        <div className="mt-2 grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mt-3 text-lg font-semibold text-brown">Would put down a deposit</h3>
            <BarList rows={depositOptions.map((o) => ({ label: o, value: depositMap.get(o) ?? 0 }))} total={applications} />
          </div>
          <div>
            <h3 className="mt-3 text-lg font-semibold text-brown">Wants to help build</h3>
            <BarList rows={helpOptions.map((o) => ({ label: o, value: helpMap.get(o) ?? 0 }))} total={applications} />
          </div>
          <div>
            <h3 className="mt-3 text-lg font-semibold text-brown">Perks that matter most</h3>
            <BarList
              rows={perks.map((o) => ({ label: o, value: perkMap.get(o) ?? 0 })).sort((a, b) => b.value - a.value)}
              total={applications}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="recent" className="mt-8 card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="recent" className="text-2xl font-medium text-brown">
            Newest members
          </h2>
          <Link href="/admin/members" className="link text-base">
            All members →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-base">No members yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="table-admin min-w-[36rem]">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Field</th>
                  <th scope="col">City</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="block text-brown">{u.name ?? "—"}</span>
                      <span className="block text-sm text-ink">{u.email}</span>
                    </td>
                    <td>{u.field?.name ?? "—"}</td>
                    <td>{u.city ?? "—"}</td>
                    <td className="whitespace-nowrap">
                      {u.createdAt.toLocaleDateString("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>{u.status === "SUSPENDED" ? "Suspended" : u.onboardedAt ? "Set up" : "Not set up yet"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
