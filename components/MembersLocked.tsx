import Link from "next/link";
import { SignInButton } from "@/components/AuthButtons";
import { copy } from "@/content/copy";

/** Shown on the members-only social screens to anyone who isn't an active member. */
export function MembersLocked({ signedIn, callbackUrl }: { signedIn: boolean; callbackUrl: string }) {
  return (
    <div className="mx-auto max-w-xl px-5 pt-8 pb-10">
      <div className="bg-ink p-6 text-ivory">
        <p className="opacity-85">{copy.social.locked}</p>
        <div className="mt-5">
          {signedIn ? (
            <Link href="/dashboard/membership" className="btn btn-light">
              {copy.app.join.cta}
            </Link>
          ) : (
            <SignInButton label={copy.app.guest.signIn} callbackUrl={callbackUrl} className="btn btn-light" />
          )}
        </div>
      </div>
    </div>
  );
}
