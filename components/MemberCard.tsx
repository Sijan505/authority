import { Avatar } from "@/components/Avatar";
import { LOGO_PATH } from "@/components/Decor";
import { copy } from "@/content/copy";
import type { CardData } from "@/lib/member-card";

const shortDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kathmandu" });

/**
 * The face of the Authority membership card: star, wordmark, photo, name, member
 * number, valid-until date and the QR a partner venue scans. `intro` adds the
 * animation hooks the app intro uses (see globals.css, "App intro").
 */
export function CardFace({ card, intro = false }: { card: CardData | null; intro?: boolean }) {
  const a = copy.app;
  const fade = intro ? "app-intro-fade" : "";
  const name = card?.name || a.tierGuest;
  const line = !card ? a.intro.guest : card.number ? a.memberNo(card.number) : card.member ? a.tierMember : a.tierNotMember;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <svg viewBox="0 0 48 48" className={`${intro ? "app-intro-star" : ""} h-8 w-8 text-tika`} fill="none" aria-hidden="true">
            <path d={LOGO_PATH} pathLength={1} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <p className={`${intro ? "app-intro-word" : ""} wordmark-gradient mt-2 font-serif text-[1.5rem] leading-none font-light tracking-[0.22em]`}>{copy.brand.wordmark}</p>
          <p className={`${fade} mt-1.5 text-[0.5rem] tracking-[0.3em] text-mute uppercase`}>{a.intro.card}</p>
        </div>
        {card?.qr && (
          <div
            className={`${fade} card-qr h-[68px] w-[68px] shrink-0 rounded-md bg-white p-1.5 shadow-[inset_0_0_0_1px_rgba(200,150,42,0.35)]`}
            role="img"
            aria-label={a.card.qrLabel}
            dangerouslySetInnerHTML={{ __html: card.qr }}
          />
        )}
      </div>
      <div>
        <div className={`${intro ? "app-intro-rule" : "card-rule"} h-px w-full`} />
        <div className={`${fade} mt-3 flex items-center gap-3`} style={intro ? { animationDelay: "1.35s" } : undefined}>
          <Avatar name={card?.name ?? null} image={card?.photo ?? null} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[1rem] leading-tight font-light tracking-[0.1em] text-ink uppercase">{name}</p>
            <p className="mt-0.5 flex flex-wrap gap-x-2 text-[0.5625rem] tracking-[0.18em] text-tika uppercase">
              <span>{line}</span>
              {card?.member && card.validUntil && (
                <span className="text-mute">
                  {a.card.validUntil} {shortDate(card.validUntil)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/** The card as it sits on a page (home dashboard, account). */
export function MemberCard({ card }: { card: CardData | null }) {
  return (
    <div className="member-card relative mx-auto flex aspect-[1.586] w-full max-w-[360px] flex-col justify-between overflow-hidden rounded-2xl p-5">
      <CardFace card={card} />
    </div>
  );
}
