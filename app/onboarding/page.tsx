import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, PageHeading } from "@/components/Decor";
import { copy } from "@/content/copy";
import { fieldConfig } from "@/content/fields";
import { requireViewer } from "@/lib/access";
import { listFields } from "@/lib/queries";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: copy.onboarding.heading };

export default async function OnboardingPage() {
  const viewer = await requireViewer();
  if (viewer.onboarded) redirect("/dashboard");
  const fields = await listFields();

  return (
    <Container narrow>
      <PageHeading title={copy.onboarding.heading} intro={copy.onboarding.intro} />
      <div className="mt-10">
        <OnboardingForm
          fields={fields.map((f) => {
            const cfg = fieldConfig(f.slug);
            return { value: f.slug, label: f.name, description: cfg.heroText, accent: cfg.accent, tint: cfg.tint };
          })}
          defaults={{ name: viewer.user.name ?? "", contact: viewer.user.email }}
        />
      </div>
    </Container>
  );
}
