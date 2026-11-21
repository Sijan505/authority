import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/Decor";
import { copy } from "@/content/copy";

export const metadata: Metadata = { title: copy.privacy.heading };

export default function PrivacyPage() {
  return (
    <Container narrow>
      <PageHeading title={copy.privacy.heading} />
      <div className="mt-10 space-y-4 text-lg leading-relaxed">
        {copy.privacy.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Container>
  );
}
