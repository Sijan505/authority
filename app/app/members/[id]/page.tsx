import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/components/ArticleCard";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { BlockButton } from "@/components/community";
import { MembersLocked } from "@/components/MembersLocked";
import { ConnectButton, DisconnectButton } from "@/components/social";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";
import { activeMemberWhere, blockedEitherWay, connectionBetween, relationOf } from "@/lib/social";

export const metadata = { title: "Member" };

/** One member's profile, with connect / message / block. Only active members, never blocked ones. */
export default async function MemberProfile({ params }: PageProps<"/app/members/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  const t = copy.social;
  if (viewer?.plan !== "PRO") {
    return (
      <main>
        <AppHeader label={t.members} />
        <MembersLocked signedIn={!!viewer} callbackUrl={`/app/members/${id}`} />
      </main>
    );
  }
  if (id === viewer.user.id) {
    return (
      <main>
        <AppHeader label={t.members} title={viewer.user.name ?? ""} />
        <div className="mx-auto max-w-xl px-5 pt-8">
          <Link href="/app/account" className="link">
            {copy.app.tabs.account}
          </Link>
        </div>
      </main>
    );
  }

  const [person, blocked, c, since, iBlocked] = await Promise.all([
    db.user.findFirst({
      where: { id, ...activeMemberWhere() },
      select: { id: true, name: true, image: true, photoUpdatedAt: true, city: true, field: { select: { name: true } } },
    }),
    blockedEitherWay(viewer.user.id, id),
    connectionBetween(viewer.user.id, id),
    db.subscription.findFirst({ where: { userId: id, package: "PRO", status: "ACTIVE", startsAt: { not: null } }, orderBy: { startsAt: "asc" }, select: { startsAt: true } }),
    db.userBlock.count({ where: { blockerId: viewer.user.id, blockedId: id } }),
  ]);
  // Someone who blocked the viewer simply doesn't exist for them. If the viewer did
  // the blocking, show just enough to unblock.
  if (!person || (blocked && !iBlocked)) notFound();
  const relation = relationOf(viewer.user.id, c);

  return (
    <main>
      <AppHeader label={t.members} />
      <div className="mx-auto max-w-xl px-5 pb-10">
        <div className="-mt-10 flex flex-col items-center text-center">
          <Avatar name={person.name} image={photoUrl(person)} size={104} />
          <h1 className="mt-4 font-serif text-[2rem] leading-tight font-light">{person.name}</h1>
          <p className="mt-1 text-mute">{[person.field?.name, person.city].filter(Boolean).join(" · ")}</p>
          {since?.startsAt && (
            <p className="mt-2 text-[0.6875rem] tracking-[0.2em] text-tika uppercase">
              {t.memberSince} {formatDate(since.startsAt)}
            </p>
          )}

          {!iBlocked && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {relation === "connected" ? (
                <>
                  <Link href={`/app/messages/${person.id}`} className="btn">
                    {t.message}
                  </Link>
                  <span className="btn btn-alt pointer-events-none">✓ {t.connected}</span>
                </>
              ) : (
                <ConnectButton userId={person.id} relation={relation} connectionId={c?.id} size="lg" />
              )}
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line pt-5">
          {relation === "connected" && !iBlocked && <DisconnectButton userId={person.id} label={t.remove} confirm={`${t.remove}?`} />}
          <BlockButton userId={person.id} blocked={iBlocked > 0} />
        </div>
      </div>
    </main>
  );
}
