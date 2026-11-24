import Link from "next/link";
import DiscussionPage from "@/app/dashboard/discussion/page";
import { AppHeader } from "@/components/AppHeader";
import { SignInButton } from "@/components/AuthButtons";
import { FieldTheme } from "@/components/FieldTheme";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";

export const metadata = { title: "Forum" };

/** The member's field discussion, inside the app. Members only (the discussion page checks again). */
export default async function ForumPage() {
  const viewer = await getViewer();
  const t = copy.app.forum;
  const member = viewer?.plan === "PRO" && viewer.onboarded;

  return (
    <main>
      <AppHeader label={copy.app.tabs.forum} title={viewer?.user.field?.name ?? copy.discussion.heading} />
      {member ? (
        <FieldTheme slug={viewer.user.field?.slug}>
          <DiscussionPage />
        </FieldTheme>
      ) : (
        <div className="mx-auto max-w-xl px-5 pt-8 pb-10">
          <div className="bg-ink p-6 text-ivory">
            <h2 className="font-serif text-[1.5rem] font-light">{t.lockedHeading}</h2>
            <p className="mt-2 opacity-80">{t.lockedBody}</p>
            <div className="mt-5">
              {viewer ? (
                <Link href="/dashboard/membership" className="btn btn-light">
                  {copy.app.join.cta}
                </Link>
              ) : (
                <SignInButton label={copy.app.guest.signIn} callbackUrl="/app/forum" className="btn btn-light" />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
