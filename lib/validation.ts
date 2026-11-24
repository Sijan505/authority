import { z } from "zod";
import { cities, conciergeCategories, contributionOptions, helpOptions, inquiryFields, inquirySources, perks } from "@/config/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Classifies and normalises an email or WhatsApp number, or returns null if neither. */
export function parseContact(raw: string): { type: "email" | "whatsapp"; normalized: string } | null {
  const value = raw.trim();
  if (EMAIL_RE.test(value)) return { type: "email", normalized: value.toLowerCase() };
  if (!/^\+?[\d\s\-().]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("9")) digits = "977" + digits; // local Nepali mobile
  if (digits.length < 8 || digits.length > 15) return null;
  return { type: "whatsapp", normalized: "+" + digits };
}

const text = (max: number) => z.string().trim().max(max);
const id = z.string().trim().min(1).max(40);

export const onboardingSchema = z
  .object({
    field: z.string().trim().min(1, "Please choose your field.").max(40),
    name: text(120).min(1, "Please tell us your name."),
    city: z.enum(cities, { message: "Please choose your city." }),
    contact: text(200)
      .min(1, "We need an email or WhatsApp number.")
      .refine((v) => parseContact(v) !== null, "Enter a valid email (name@example.com) or WhatsApp number (98XXXXXXXX)."),
    perks: z.array(z.enum(perks)).max(perks.length).default([]),
    helpBuild: z.enum(helpOptions, { message: "Please choose an answer." }),
    contribution: text(1000).optional().default(""),
  })
  .transform((v) => ({
    ...v,
    contribution: v.helpBuild === helpOptions[2] ? "" : v.contribution,
  }));

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const paymentSchema = z
  .object({
    cycle: z.enum(["MONTHLY", "YEARLY"]),
    method: z.enum(["ESEWA", "KHALTI", "BANK_TRANSFER"]),
    reference: text(120),
    screenshot: z
      .instanceof(File)
      .optional()
      .transform((f) => (f && f.size > 0 ? f : undefined))
      .refine((f) => !f || f.size <= MAX_UPLOAD_BYTES, "The screenshot must be 2 MB or smaller.")
      .refine((f) => !f || UPLOAD_TYPES.includes(f.type), "Upload a JPG, PNG, WebP or PDF."),
  })
  .refine((v) => v.reference.length > 0 || v.screenshot, {
    message: "Add a payment reference or a screenshot.",
    path: ["reference"],
  });

export const commentSchema = z.object({
  articleId: id,
  body: text(2000).min(1, "Write something first."),
});

export const postSchema = z.object({
  body: text(2000).min(1, "Write something first."),
  parentId: id.optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(["comment", "post"]),
  targetId: id,
  reason: text(500).min(1, "Please give a reason."),
});

export const blockSchema = z.object({ userId: id });

// ---- Admin ----

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80);

export const articleSchema = z.object({
  id: id.optional(),
  title: text(200).min(1, "Title is required."),
  slug: text(100)
    .optional()
    .default("")
    .refine((s) => s === "" || /^[a-z0-9-]+$/.test(s), "Use lower-case letters, numbers and hyphens."),
  excerpt: text(500).min(1, "Excerpt is required."),
  body: text(50000).min(1, "Body is required."),
  fieldId: id,
  authorName: text(120).min(1, "Author is required."),
  tags: text(300)
    .optional()
    .default("")
    .transform((t) =>
      t
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 10),
    ),
  publish: z.coerce.boolean().default(false),
});

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !isNaN(d.getTime()), "Invalid date.");

export const offerSchema = z
  .object({
    id: id.optional(),
    fieldId: id,
    name: text(150).min(1, "Name is required."),
    venue: text(150).min(1, "Venue is required."),
    discountText: text(300).min(1, "Discount text is required."),
    validFrom: optionalDate,
    validUntil: optionalDate,
    active: z.coerce.boolean().default(false),
  })
  .refine((o) => !o.validFrom || !o.validUntil || o.validFrom <= o.validUntil, {
    message: "Valid until must be after valid from.",
    path: ["validUntil"],
  });

export const verifyPaymentSchema = z.object({
  paymentId: id,
  decision: z.enum(["verify", "reject"]),
  note: text(500).optional().default(""),
});

export const memberUpdateSchema = z.object({
  userId: id,
  fieldId: id.optional(),
  package: z.enum(["BASIC", "PRO"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export const moderationSchema = z.object({
  reportId: id,
  action: z.enum(["remove", "suspend", "dismiss"]),
});

/** First error message per field, for showing next to inputs. */
/** Short reference shown to the visitor after an inquiry and on the admin list, e.g. "AU-7K3F9Q". */
export const inquiryRef = (id: string) => `AU-${id.slice(-6).toUpperCase()}`;

/** Longest answer the inquiry accepts for each text field; the form uses the same limits. */
export const INQUIRY_LIMITS = { name: 120, contact: 200, craft: 300, about: 2000 } as const;

export const inquirySchema = z
  .object({
    field: z.enum(inquiryFields, { message: "Please choose your field." }),
    name: text(INQUIRY_LIMITS.name).min(1, "Please tell us your name."),
    city: z.enum(cities, { message: "Please choose your city." }),
    contact: text(INQUIRY_LIMITS.contact)
      .min(1, "We need an email or WhatsApp number to send your invite.")
      .refine((v) => parseContact(v) !== null, "Enter a valid email (name@example.com) or WhatsApp number (98XXXXXXXX)."),
    craft: text(INQUIRY_LIMITS.craft).min(1, "Please share at least one handle or link."),
    about: text(INQUIRY_LIMITS.about).min(1, "Please tell us a little about yourself."),
    helpBuild: z.enum(helpOptions, { message: "Please choose an answer." }),
    contribution: z.array(z.enum(contributionOptions)).max(contributionOptions.length).default([]),
    source: z.enum(inquirySources).catch("Direct"),
    sourceDetail: text(200).catch("").transform((v) => v || null),
  })
  .transform(({ contact, ...v }) => {
    const c = parseContact(contact)!;
    return {
      ...v,
      contact: c.normalized,
      contactType: c.type,
      // Only people who might help say how.
      contribution: v.helpBuild === helpOptions[2] ? [] : [...new Set(v.contribution)],
    };
  });

// ---- The Request Desk ----

const optionalText = (max: number) =>
  text(max)
    .optional()
    .default("")
    .transform((v) => v || null);

export const conciergeSchema = z.object({
  category: z.enum(conciergeCategories, { message: "Please choose what it is about." }),
  details: text(2000).min(1, "Tell us what you would like."),
  city: optionalText(80),
  date: optionalText(80),
  people: z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((v) => (v ? Number(v) : null))
    .refine((n) => n === null || (Number.isInteger(n) && n >= 1 && n <= 50), "Enter a number from 1 to 50."),
});

export const conciergeReplySchema = z.object({
  id,
  status: z.enum(["NEW", "IN_PROGRESS", "DONE", "DECLINED"]),
  reply: optionalText(2000),
});

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> };
