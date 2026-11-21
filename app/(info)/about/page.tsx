import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/Decor";
import { copy } from "@/content/copy";

export const metadata: Metadata = { title: copy.about.heading };

export default function AboutPage() {
  return (
    <Container narrow>
      <PageHeading title={copy.about.heading} />
      <div className="mt-10 space-y-5 text-lg leading-relaxed">
        {copy.about.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Container>
  );
}
