import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/Decor";
import { copy } from "@/content/copy";

export const metadata: Metadata = { title: copy.faq.heading };

export default function FaqPage() {
  return (
    <Container narrow>
      <PageHeading title={copy.faq.heading} />
      <div className="mt-10 divide-y divide-gold/30 border-y border-gold/30">
        {copy.faq.items.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold text-brown [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="text-gold-dark transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-3">{f.a}</p>
          </details>
        ))}
      </div>
    </Container>
  );
}
