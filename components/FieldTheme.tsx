import { fieldConfig } from "@/content/fields";

/** Applies a field's accent colours (from content/fields.ts) to everything inside. */
export function FieldTheme({ slug, children }: { slug: string | null | undefined; children: React.ReactNode }) {
  const f = fieldConfig(slug);
  return <div style={{ "--accent": f.accent, "--tint": f.tint } as React.CSSProperties}>{children}</div>;
}
