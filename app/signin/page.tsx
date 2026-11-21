import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/AuthButtons";
import { Container, Star } from "@/components/Decor";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";

export const metadata: Metadata = { title: copy.nav.signIn };

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const viewer = await getViewer();
  if (viewer && !viewer.suspended && !error) redirect("/dashboard");

  // Only allow relative callback URLs.
  const raw = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/dashboard";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  const t = copy.signIn;

  return (
    <Container narrow>
      <div className="text-center">
        <Star className="mx-auto h-10 w-10" />
        <h1 className="mt-4 text-4xl font-medium text-brown">{t.heading}</h1>
        <p className="mt-3 text-lg">{t.body}</p>
        {error && (
          <p role="alert" className="mt-6 text-error">
            {t.errors[error] ?? t.errors.default}
          </p>
        )}
        <div className="mt-8">
          <SignInButton callbackUrl={callbackUrl} />
        </div>
      </div>
    </Container>
  );
}
