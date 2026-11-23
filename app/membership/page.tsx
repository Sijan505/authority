import type { Metadata } from "next";
import Link from "next/link";
import { SignInButton } from "@/components/AuthButtons";
import { Container, PageHeading } from "@/components/Decor";
import { formatNPR, packages, paymentMethods, proPrices, proYearlyFullPrice } from "@/config/pricing";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";

export const metadata: Metadata = { title: copy.membership.heading };

function Features({ list }: { list: string[] }) {
  return (
    <ul className="mt-6 flex-1 space-y-2">
      {list.map((f) => (
        <li key={f} className="flex gap-2">
          <span className="text-gold-dark" aria-hidden="true">
            ✦
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}

export default async function MembershipPage() {
  const viewer = await getViewer();
  const t = copy.membership;

  return (
    <Container>
      <PageHeading title={t.heading} intro={t.intro} />
      <div className="card mx-auto mt-12 flex max-w-xl flex-col border-2 border-gold-dark p-6 md:p-10">
        <h2 className="text-3xl font-medium text-brown">{packages.PRO.name}</h2>
        <p className="mt-4">
          <span className="text-3xl font-semibold text-brown">{formatNPR(proPrices.MONTHLY)}</span> {t.monthly}
        </p>
        <p className="mt-1">
          <span className="text-2xl font-semibold text-brown">{formatNPR(proPrices.YEARLY)}</span> {t.yearly}{" "}
          <span className="text-gold-dark">({t.yearlySaving(formatNPR(proYearlyFullPrice))})</span>
        </p>
        <Features list={packages.PRO.features} />
        <div className="mt-8">
          {viewer ? (
            <Link href="/dashboard/membership" className="btn w-full">
              {t.choosePro}
            </Link>
          ) : (
            <SignInButton label={t.signInToJoin} callbackUrl="/dashboard/membership" className="btn w-full" />
          )}
        </div>
        <p className="mt-4 text-sm text-mute">{t.note}</p>
      </div>
      <p className="mt-10 text-center">
        {t.payWith}{" "}
        {Object.values(paymentMethods)
          .map((m) => m.name)
          .join(" · ")}
      </p>
    </Container>
  );
}
