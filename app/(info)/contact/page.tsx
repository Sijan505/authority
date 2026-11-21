import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/Decor";
import { site } from "@/config/site";
import { copy } from "@/content/copy";

export const metadata: Metadata = { title: copy.contact.heading };

export default function ContactPage() {
  return (
    <Container narrow>
      <PageHeading title={copy.contact.heading} intro={copy.contact.body} />
      <ul className="mt-10 space-y-3 text-center text-xl">
        <li>
          <a href={`mailto:${site.contactEmail}`} className="link">
            {site.contactEmail}
          </a>
        </li>
        <li>
          <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="link">
            {site.instagramHandle}
          </a>
        </li>
      </ul>
    </Container>
  );
}
