import Link from "next/link";
import { formatDate } from "@/components/ArticleCard";
import { Avatar } from "@/components/Avatar";
import { cities } from "@/config/site";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { userIdByMemberNumber } from "@/lib/app";
import { photoUrl } from "@/lib/photo";
import { listFields } from "@/lib/queries";

/** Ids an admin's search points to directly: a member number ("001", "No. 1"), a card code or an account id. */
async function directMatches(q: string) {
  const ids = new Set<string>();
  const num = /^(?:no\.?\s*|#)?0*(\d{1,6})$/i.exec(q);
  if (num) {
    const id = await userIdByMemberNumber(Number(num[1]));
    if (id) ids.add(id);
  }
  if (/^[\w-]{12,40}$/.test(q)) {
    const byCode = await db.user.findFirst({ where: { OR: [{ memberCode: q }, { id: q }] }, select: { id: true } });
    if (byCode) ids.add(byCode.id);
  }
  return [...ids];
}

export default async function AdminMembers({ searchParams }: PageProps<"/admin/members">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const field = typeof sp.field === "string" ? sp.field.slice(0, 40) : "";
  const city = typeof sp.city === "string" ? sp.city.slice(0, 40) : "";
  const now = new Date();

  const direct = q ? await directMatches(q) : [];
  const [fields, users] = await Promise.all([
    listFields(),
    db.user.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { contact: { contains: q, mode: "insensitive" } },
                ...(direct.length ? [{ id: { in: direct } }] : []),
              ],
            }
          : {}),
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
      },
    }),
  ]);
  // A member-number, card-code or id match goes to the top.
  users.sort((a, b) => Number(direct.includes(b.id)) - Number(direct.includes(a.id)));

  return (
    <>
      <h1 className="text-4xl font-medium text-brown">Members</h1>

      <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" role="search">
        <label className="flex-1 text-sm">
          Search members
          <input name="q" type="search" defaultValue={q} placeholder="Name, email, phone, member no. (e.g. 001) or card code" className="input mt-1" autoFocus />
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
          Search
        </button>
      </form>

      {q && <p className="mt-6 text-sm text-mute">{users.length === 0 ? "No members match." : `${users.length} result${users.length === 1 ? "" : "s"} for “${q}”.`}</p>}
      <ul className="mt-4 space-y-3">
        {users.map((u) => {
          const pro = u.subscriptions.length > 0;
          return (
            <li key={u.id} className={`card flex flex-wrap items-center gap-4 ${direct.includes(u.id) ? "border-2 border-gold" : ""}`}>
              <Avatar name={u.name} image={photoUrl(u)} size={52} />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-brown">
                  {u.name ?? "—"} {u.role === "ADMIN" && <span className="text-sm text-gold-dark">(admin)</span>}
                  {u.status === "SUSPENDED" && <span className="text-sm text-error"> suspended</span>}
                </p>
                <p className="truncate text-sm text-mute">
                  {u.email} · {u.field?.name ?? "No field"} · {u.city ?? "No city"}
                </p>
                <p className="text-sm">
                  {pro ? `Member until ${formatDate(u.subscriptions[0].expiresAt)}` : u.onboardedAt ? "Signed up, not a member" : "Hasn't finished setup"} · Joined{" "}
                  {formatDate(u.createdAt)}
                </p>
              </div>
              <Link href={`/admin/members/${u.id}`} className="btn btn-sm">
                Manage
              </Link>
            </li>
          );
        })}
      </ul>
      {users.length === 100 && <p className="mt-4 text-sm">Showing the 100 most recent. Use the filters to narrow down.</p>}
    </>
  );
}
