import { formatDate } from "@/components/ArticleCard";
import { cities } from "@/config/site";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { listFields } from "@/lib/queries";
import { MemberForm } from "../forms";

export default async function AdminMembers({ searchParams }: PageProps<"/admin/members">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const field = typeof sp.field === "string" ? sp.field.slice(0, 40) : "";
  const city = typeof sp.city === "string" ? sp.city.slice(0, 40) : "";
  const now = new Date();

  const [fields, users] = await Promise.all([
    listFields(),
    db.user.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
        ...(field ? { fieldId: field } : {}),
        ...(city ? { city } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        field: { select: { name: true } },
        subscriptions: {
          where: { package: "PRO", status: "ACTIVE", startsAt: { lte: now }, expiresAt: { gt: now } },
          orderBy: { expiresAt: "desc" },
        },
        application: { select: { deposit: true, helpBuild: true, perks: true } },
      },
    }),
  ]);
  const fieldOptions = fields.map((f) => ({ value: f.id, label: f.name }));

  return (
    <>
      <h1 className="text-4xl font-medium text-brown">Members</h1>

      <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" role="search">
        <label className="flex-1 text-sm">
          Name or email
          <input name="q" type="search" defaultValue={q} className="input mt-1" />
        </label>
        <label className="text-sm">
          Field
          <select name="field" defaultValue={field} className="input mt-1">
            <option value="">All</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          City
          <select name="city" defaultValue={city} className="input mt-1">
            <option value="">All</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-sm">
          Filter
        </button>
      </form>

      <ul className="mt-8 space-y-4">
        {users.map((u) => {
          const pro = u.subscriptions.length > 0;
          return (
            <li key={u.id} className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xl font-semibold text-brown">
                  {u.name ?? "—"} {u.role === "ADMIN" && <span className="text-sm text-gold-dark">(admin)</span>}
                  {u.status === "SUSPENDED" && <span className="text-sm text-error"> suspended</span>}
                </p>
                <p className="text-sm">Joined {formatDate(u.createdAt)}</p>
              </div>
              <p className="text-sm">
                {u.email} {u.contact && u.contact !== u.email && <>· {u.contact}</>} · {u.city ?? "No city"} ·{" "}
                {u.field?.name ?? "Not onboarded"} ·{" "}
                {pro ? `Pro until ${formatDate(u.subscriptions[0].expiresAt)}` : u.onboardedAt ? "Basic (free)" : "No membership yet"}
              </p>
              {u.application && (
                <p className="text-sm">
                  Deposit: {u.application.deposit} · Help build: {u.application.helpBuild}
                  {u.application.perks.length > 0 && <> · Perks: {u.application.perks.join(", ")}</>}
                </p>
              )}
              <div className="mt-3">
                <MemberForm userId={u.id} fieldId={u.fieldId} status={u.status} hasPro={pro} fields={fieldOptions} />
              </div>
            </li>
          );
        })}
      </ul>
      {users.length === 100 && <p className="mt-4 text-sm">Showing the 100 most recent. Use the filters to narrow down.</p>}
    </>
  );
}
