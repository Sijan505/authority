import "server-only";
import { db } from "@/lib/db";

/** Public article fields. Never includes `body`: full bodies are fetched only after an access check. */
export const articleSummarySelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  authorName: true,
  publishedAt: true,
  fieldId: true,
  tags: true,
  field: { select: { slug: true, name: true } },
} as const;

export const publishedWhere = () => ({ status: "PUBLISHED" as const, publishedAt: { lte: new Date() } });

export function listFields() {
  return db.field.findMany({ orderBy: { position: "asc" } });
}

/** Offers that are switched on and inside their validity window. */
export function liveOffersWhere(fieldId: string) {
  const now = new Date();
  return {
    fieldId,
    active: true,
    AND: [
      { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
      { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
    ],
  };
}
