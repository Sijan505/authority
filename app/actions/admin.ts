"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CYCLE_DAYS } from "@/config/pricing";
import { AccessError, assertAdmin } from "@/lib/access";
import { runAction } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  articleSchema,
  fieldErrors,
  memberUpdateSchema,
  moderationSchema,
  offerSchema,
  slugify,
  verifyPaymentSchema,
  type ActionState,
} from "@/lib/validation";

const LIMIT = { max: 120, windowSeconds: 300 };
const DAY = 86_400_000;

// ---- Payments ----

export async function reviewPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = verifyPaymentSchema.safeParse({
      paymentId: formData.get("paymentId"),
      decision: formData.get("decision"),
      note: formData.get("note") ?? "",
    });
    if (!parsed.success) return { message: "Invalid request." };
    const { paymentId, decision, note } = parsed.data;

    await db.$transaction(async (tx) => {
      const now = new Date();
      // Claim the payment only if it is still pending, so it can't be processed twice.
      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, status: "PENDING" },
        data: {
          status: decision === "verify" ? "VERIFIED" : "REJECTED",
          note: note || null,
          verifiedById: admin.user.id,
          verifiedAt: now,
        },
      });
      if (claimed.count !== 1) throw new AccessError("This payment has already been reviewed.");

      const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { subscription: true } });
      const sub = payment.subscription;

      if (decision === "reject") {
        await tx.subscription.update({ where: { id: sub.id }, data: { status: "REJECTED" } });
      } else {
        // Renewals start when the member's current paid time of the same package ends.
        // An upgrade to Pro starts immediately.
        const running = await tx.subscription.findFirst({
          where: { userId: sub.userId, status: "ACTIVE", package: sub.package, expiresAt: { gt: now } },
          orderBy: { expiresAt: "desc" },
        });
        const startsAt = running?.expiresAt && running.expiresAt > now ? running.expiresAt : now;
        const expiresAt = new Date(startsAt.getTime() + CYCLE_DAYS[sub.billingCycle] * DAY);
        await tx.subscription.update({ where: { id: sub.id }, data: { status: "ACTIVE", startsAt, expiresAt } });
      }

      await audit(tx, {
        actorId: admin.user.id,
        action: decision === "verify" ? "payment.verify" : "payment.reject",
        targetType: "payment",
        targetId: paymentId,
        details: { userId: sub.userId, amount: payment.amount, package: sub.package, cycle: sub.billingCycle, note },
      });
    });

    revalidatePath("/admin", "layout");
    return { ok: true, message: decision === "verify" ? "Payment verified. Membership is active." : "Payment rejected." };
  });
}

// ---- Articles ----

export async function saveArticle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = await runAction("admin", LIMIT, async (): Promise<ActionState> => {
    await assertAdmin();
    const parsed = articleSchema.safeParse({
      id: formData.get("id") || undefined,
      title: formData.get("title"),
      slug: formData.get("slug") ?? "",
      excerpt: formData.get("excerpt"),
      body: formData.get("body"),
      fieldId: formData.get("fieldId"),
      authorName: formData.get("authorName"),
      tags: formData.get("tags") ?? "",
      publish: formData.get("publish") ?? undefined,
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the highlighted fields." };
    const v = parsed.data;

    const slug = v.slug || slugify(v.title);
    const clash = await db.article.findFirst({ where: { slug, NOT: v.id ? { id: v.id } : undefined } });
    if (clash) return { errors: { slug: "Another article uses this slug." } };
    if (!(await db.field.findUnique({ where: { id: v.fieldId } }))) return { errors: { fieldId: "Choose a field." } };

    const existing = v.id ? await db.article.findUnique({ where: { id: v.id } }) : null;
    const data = {
      title: v.title,
      slug,
      excerpt: v.excerpt,
      body: v.body,
      fieldId: v.fieldId,
      authorName: v.authorName,
      tags: v.tags,
      status: v.publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
      publishedAt: v.publish ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    };
    if (existing) await db.article.update({ where: { id: existing.id }, data });
    else await db.article.create({ data });

    revalidatePath("/", "layout");
    return { ok: true };
  });
  if (result.ok) redirect("/admin/articles");
  return result;
}

export async function setArticleStatus(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const publish = formData.get("publish") === "1";
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return;
  await db.article.update({
    where: { id },
    data: { status: publish ? "PUBLISHED" : "DRAFT", publishedAt: publish ? (article.publishedAt ?? new Date()) : article.publishedAt },
  });
  revalidatePath("/", "layout");
}

// ---- Offers ----

export async function saveOffer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = await runAction("admin", LIMIT, async (): Promise<ActionState> => {
    await assertAdmin();
    const parsed = offerSchema.safeParse({
      id: formData.get("id") || undefined,
      fieldId: formData.get("fieldId"),
      name: formData.get("name"),
      venue: formData.get("venue"),
      discountText: formData.get("discountText"),
      validFrom: formData.get("validFrom") || undefined,
      validUntil: formData.get("validUntil") || undefined,
      active: formData.get("active") ?? undefined,
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the highlighted fields." };
    const { id, ...data } = parsed.data;
    if (!(await db.field.findUnique({ where: { id: data.fieldId } }))) return { errors: { fieldId: "Choose a field." } };

    if (id) await db.offer.update({ where: { id }, data });
    else await db.offer.create({ data });
    revalidatePath("/", "layout");
    return { ok: true };
  });
  if (result.ok) redirect("/admin/offers");
  return result;
}

// ---- Members ----

export async function updateMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = memberUpdateSchema.safeParse({
      userId: formData.get("userId"),
      fieldId: formData.get("fieldId") || undefined,
      package: formData.get("package") || undefined,
      status: formData.get("status") || undefined,
    });
    if (!parsed.success) return { message: "Invalid request." };
    const v = parsed.data;

    const user = await db.user.findUnique({ where: { id: v.userId } });
    if (!user) return { message: "Member not found." };
    if (user.id === admin.user.id && v.status === "SUSPENDED") return { message: "You can't suspend yourself." };

    const changes: string[] = [];
    await db.$transaction(async (tx) => {
      if (v.fieldId && v.fieldId !== user.fieldId) {
        const field = await tx.field.findUnique({ where: { id: v.fieldId } });
        if (!field) throw new AccessError("Field not found.");
        await tx.user.update({ where: { id: user.id }, data: { fieldId: field.id } });
        await audit(tx, { actorId: admin.user.id, action: "member.change_field", targetType: "user", targetId: user.id, details: { from: user.fieldId, to: field.id } });
        changes.push("field");
      }

      if (v.status && v.status !== user.status) {
        await tx.user.update({ where: { id: user.id }, data: { status: v.status } });
        await audit(tx, { actorId: admin.user.id, action: v.status === "SUSPENDED" ? "member.suspend" : "member.reinstate", targetType: "user", targetId: user.id });
        changes.push("status");
      }

      if (v.package === "BASIC") {
        // Moving to Basic ends Pro now: cancels current and already-paid future Pro periods.
        const pro = await tx.subscription.findMany({
          where: { userId: user.id, package: "PRO", status: "ACTIVE", expiresAt: { gt: new Date() } },
          select: { id: true },
        });
        if (pro.length) {
          await tx.subscription.updateMany({ where: { id: { in: pro.map((s) => s.id) } }, data: { status: "CANCELLED" } });
          await audit(tx, {
            actorId: admin.user.id,
            action: "member.change_package",
            targetType: "user",
            targetId: user.id,
            details: { from: "PRO", to: "BASIC", cancelledSubscriptions: pro.map((s) => s.id) },
          });
          changes.push("package");
        }
      } else if (v.package === "PRO") {
        const now = new Date();
        const hasPro = await tx.subscription.findFirst({
          where: { userId: user.id, package: "PRO", status: "ACTIVE", startsAt: { lte: now }, expiresAt: { gt: now } },
        });
        if (!hasPro) throw new AccessError("Pro starts when you verify the member's payment in Payments.");
      }
    });

    revalidatePath("/admin/members");
    return { ok: true, message: changes.length ? "Member updated." : "No changes." };
  });
}

// ---- Moderation ----

export async function moderate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = moderationSchema.safeParse({ reportId: formData.get("reportId"), action: formData.get("action") });
    if (!parsed.success) return { message: "Invalid request." };
    const { reportId, action } = parsed.data;

    await db.$transaction(async (tx) => {
      const report = await tx.report.findUnique({ where: { id: reportId }, include: { comment: true, post: true } });
      if (!report || report.status !== "OPEN") throw new AccessError("This report has already been handled.");
      const now = new Date();
      const authorId = report.comment?.userId ?? report.post?.userId ?? null;

      if (action === "remove" || action === "suspend") {
        if (report.commentId) await tx.comment.update({ where: { id: report.commentId }, data: { removedAt: now } });
        if (report.postId) await tx.discussionPost.update({ where: { id: report.postId }, data: { removedAt: now } });
      }
      if (action === "suspend" && authorId && authorId !== admin.user.id) {
        await tx.user.update({ where: { id: authorId }, data: { status: "SUSPENDED" } });
        await audit(tx, { actorId: admin.user.id, action: "member.suspend", targetType: "user", targetId: authorId, details: { reportId } });
      }

      await tx.report.update({
        where: { id: reportId },
        data: { status: action === "dismiss" ? "DISMISSED" : "RESOLVED", resolvedById: admin.user.id, resolvedAt: now },
      });
      await audit(tx, {
        actorId: admin.user.id,
        action: `moderation.${action}`,
        targetType: report.commentId ? "comment" : "post",
        targetId: report.commentId ?? report.postId ?? reportId,
        details: { reportId, authorId },
      });
    });

    revalidatePath("/admin/moderation");
    return { ok: true, message: "Done." };
  });
}
