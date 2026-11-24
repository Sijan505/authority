import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { ConnectButton } from "@/components/social";
import { MembersLocked } from "@/components/MembersLocked";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";
import { activeMemberWhere, blockedIds, relationOf } from "@/lib/social";

export const metadata = { title: "Members" };

type Tab = "all" | "requests" | "connected";

/** Find members across every field, answer requests, and see connections. Members only. */
export default async function MembersPage({ searchParams }: PageProps<"/app/members">) {
  const viewer = await getViewer();
  const t = copy.social;
  const sp = await searchParams;
  const tab: Tab = sp.tab === "requests" || sp.tab === "connected" ? sp.tab : "all";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const field = typeof sp.field === "string" ? sp.field : "";

  if (viewer?.plan !== "PRO") {
    return (
      <main>
        <AppHeader label={t.members} title={t.members} />
        <MembersLocked signedIn={!!viewer} callbackUrl="/app/members" />
      </main>
    );
  }

  const me = viewer.user.id;
  const hidden = await blockedIds(me);
  const [fields, mine, pendingIn] = await Promise.all([
    db.field.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.connection.findMany({ where: { OR: [{ requesterId: me }, { addresseeId: me }] } }),
    db.connection.count({ where: { addresseeId: me, status: "PENDING" } }),
  ]);
  const byOther = new Map(mine.map((c) => [c.requesterId === me ? c.addresseeId : c.requesterId, c]));

  const select = { id: true, name: true, image: true, photoUpdatedAt: true, city: true, field: { select: { name: true } } } as const;
  let people: { id: string; name: string | null; image: string | null; photoUpdatedAt: Date | null; city: string | null; field: { name: string } | null }[] = [];
  if (tab === "all") {
    people = await db.user.findMany({
      where: {
        ...activeMemberWhere(),
        id: { notIn: [me, ...hidden] },
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
        ...(field ? { fieldId: field } : {}),
      },
      orderBy: { name: "asc" },
      take: 80,
      select,
    });
  } else {
    const ids = mine
      .filter((c) => (tab === "requests" ? c.status === "PENDING" : c.status === "ACCEPTED"))
      .map((c) => (c.requesterId === me ? c.addresseeId : c.requesterId))
      .filter((id) => !hidden.includes(id));
    people = ids.length ? await db.user.findMany({ where: { id: { in: ids }, ...activeMemberWhere() }, orderBy: { name: "asc" }, select }) : [];
    // Requests to answer come before requests the viewer sent.
    if (tab === "requests") people.sort((a, b) => Number(byOther.get(b.id)?.addresseeId === me) - Number(byOther.get(a.id)?.addresseeId === me));
  }

  const tabLink = (key: Tab) => `/app/members${key === "all" ? "" : `?tab=${key}`}`;

  return (
    <main>
      <AppHeader label={t.members} title={t.members}>
        <p className="mt-2 text-sm text-mute">{t.membersIntro}</p>
        <nav aria-label={t.members} className="mt-5 flex gap-2">
          {(["all", "requests", "connected"] as Tab[]).map((key) => (
            <Link
              key={key}
              href={tabLink(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`relative border px-3.5 py-1.5 text-[0.75rem] tracking-[0.12em] uppercase ${tab === key ? "border-ink bg-ink text-ivory" : "border-ink/25 text-mute hover:border-ink"}`}
            >
              {t.tabs[key]}
              {key === "requests" && pendingIn > 0 && <span className="ml-1.5 font-semibold">{pendingIn}</span>}
            </Link>
          ))}
        </nav>
      </AppHeader>

      <div className="mx-auto max-w-xl px-5 pt-6 pb-10">
        {tab === "all" && (
          <form className="mb-6 flex gap-2" role="search">
            <label htmlFor="m-q" className="sr-only">
              {t.search}
            </label>
            <input id="m-q" name="q" defaultValue={q} placeholder={t.search} className="min-h-11 min-w-0 flex-1 border border-ink/25 bg-paper/60 px-3 outline-none focus:border-ink" />
            <label htmlFor="m-field" className="sr-only">
              {t.allFields}
            </label>
            <select id="m-field" name="field" defaultValue={field} className="min-h-11 max-w-[9rem] border border-ink/25 bg-paper/60 px-2 text-sm">
              <option value="">{t.allFields}</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-sm min-h-11">
              {copy.articles.searchButton}
            </button>
          </form>
        )}

        {people.length === 0 ? (
          <p className="text-mute">{tab === "all" ? t.noMembers : tab === "requests" ? t.noRequests : t.noConnections}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {people.map((p) => {
              const c = byOther.get(p.id) ?? null;
              const relation = relationOf(me, c);
              return (
                <li key={p.id} className="flex items-center gap-3 py-4">
                  <Link href={`/app/members/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={p.name} image={photoUrl(p)} size={48} />
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-[1.125rem]">{p.name}</span>
                      <span className="block truncate text-sm text-mute">{[p.field?.name, p.city].filter(Boolean).join(" · ")}</span>
                    </span>
                  </Link>
                  {relation === "connected" ? (
                    <Link href={`/app/messages/${p.id}`} className="btn btn-sm btn-alt">
                      {t.message}
                    </Link>
                  ) : (
                    <ConnectButton userId={p.id} relation={relation} connectionId={c?.id} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
