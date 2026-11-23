import type { Metadata } from "next";
import { BlockButton } from "@/components/community";
import { copy } from "@/content/copy";
import { requirePro } from "@/lib/access";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: copy.directory.heading };

export default async function DirectoryPage() {
  const viewer = await requirePro();
  const t = copy.directory;

  const [members, blocks] = await Promise.all([
    // Names and fields only, for active (paying) members of the viewer's field.
    db.user.findMany({
      where: {
        fieldId: viewer.user.fieldId,
        status: "ACTIVE",
        onboardedAt: { not: null },
        id: { not: viewer.user.id },
        subscriptions: { some: { package: "PRO", status: "ACTIVE", startsAt: { lte: new Date() }, expiresAt: { gt: new Date() } } },
      },
      orderBy: { name: "asc" },
      take: 500,
      select: { id: true, name: true, field: { select: { name: true } } },
    }),
    db.userBlock.findMany({ where: { blockerId: viewer.user.id }, select: { blockedId: true } }),
  ]);
  const blocked = new Set(blocks.map((b) => b.blockedId));

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-medium text-brown">{t.heading}</h1>
      <p className="mt-2">{t.intro}</p>
      {members.length === 0 ? (
        <p className="mt-10">{t.empty}</p>
      ) : (
        <ul className="mt-8 divide-y divide-gold/30 border-y border-gold/30">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="text-lg text-brown">{m.name}</span> · <span className="accent-text">{m.field?.name}</span>
              </span>
              <BlockButton userId={m.id} blocked={blocked.has(m.id)} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
