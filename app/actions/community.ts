"use server";

import { revalidatePath } from "next/cache";
import { copy } from "@/content/copy";
import { AccessError, assertOnboarded, assertPro, canUsePro, hiddenUserIds } from "@/lib/access";
import { runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { blockSchema, commentSchema, fieldErrors, postSchema, reportSchema, type ActionState } from "@/lib/validation";

const LIMIT = { max: 20, windowSeconds: 300 };

async function proViewer() {
  return assertPro().catch((e) => {
    throw e instanceof AccessError ? e : new AccessError(copy.errors.forbidden);
  });
}

export async function addComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("comment", LIMIT, async (): Promise<ActionState> => {
    const viewer = await proViewer();
    const parsed = commentSchema.safeParse({ articleId: formData.get("articleId"), body: formData.get("body") });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const article = await db.article.findFirst({
      where: { id: parsed.data.articleId, status: "PUBLISHED" },
      select: { id: true, slug: true, fieldId: true },
    });
    // Pro members may comment only on articles in their own field.
    if (!article || !canUsePro(viewer, article.fieldId)) throw new AccessError(copy.errors.forbidden);

    await db.comment.create({ data: { articleId: article.id, userId: viewer.user.id, body: parsed.data.body } });
    revalidatePath(`/articles/${article.slug}`);
    return { ok: true };
  });
}

export async function addPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("post", LIMIT, async (): Promise<ActionState> => {
    const viewer = await proViewer();
    const parsed = postSchema.safeParse({
      body: formData.get("body"),
      parentId: formData.get("parentId") || undefined,
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const fieldId = viewer.user.fieldId!;

    if (parsed.data.parentId) {
      const hidden = await hiddenUserIds(viewer.user.id);
      const parent = await db.discussionPost.findFirst({
        where: { id: parsed.data.parentId, fieldId, parentId: null, removedAt: null, userId: { notIn: hidden } },
      });
      if (!parent) throw new AccessError(copy.errors.forbidden);
    }

    await db.discussionPost.create({
      data: { fieldId, userId: viewer.user.id, body: parsed.data.body, parentId: parsed.data.parentId ?? null },
    });
    revalidatePath("/dashboard/discussion");
    return { ok: true };
  });
}

export async function reportContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("report", { max: 10, windowSeconds: 600 }, async (): Promise<ActionState> => {
    const viewer = await proViewer();
    const parsed = reportSchema.safeParse({
      targetType: formData.get("targetType"),
      targetId: formData.get("targetId"),
      reason: formData.get("reason"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { targetType, targetId, reason } = parsed.data;

    // Members can only report content they are allowed to see: same field.
    const fieldId = viewer.user.fieldId!;
    const visible =
      targetType === "comment"
        ? await db.comment.findFirst({ where: { id: targetId, article: { fieldId } } })
        : await db.discussionPost.findFirst({ where: { id: targetId, fieldId } });
    if (!visible) throw new AccessError(copy.errors.forbidden);

    await db.report.create({
      data: {
        reporterId: viewer.user.id,
        reason,
        commentId: targetType === "comment" ? targetId : null,
        postId: targetType === "post" ? targetId : null,
      },
    });
    return { ok: true, message: copy.discussion.reported };
  });
}

export async function toggleBlock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("block", LIMIT, async (): Promise<ActionState> => {
    const viewer = await assertOnboarded();
    if (viewer.plan !== "PRO") throw new AccessError(copy.errors.forbidden);
    const parsed = blockSchema.safeParse({ userId: formData.get("userId") });
    if (!parsed.success || parsed.data.userId === viewer.user.id) return { message: copy.errors.generic };

    const key = { blockerId_blockedId: { blockerId: viewer.user.id, blockedId: parsed.data.userId } };
    const existing = await db.userBlock.findUnique({ where: key });
    if (existing) await db.userBlock.delete({ where: key });
    else {
      // Members can connect across fields in the app, so blocking works for any member.
      const target = await db.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
      if (!target) throw new AccessError(copy.errors.forbidden);
      await db.$transaction([
        db.userBlock.create({ data: { blockerId: viewer.user.id, blockedId: target.id } }),
        // Blocking also ends any connection or pending request between the two.
        db.connection.deleteMany({
          where: {
            OR: [
              { requesterId: viewer.user.id, addresseeId: target.id },
              { requesterId: target.id, addresseeId: viewer.user.id },
            ],
          },
        }),
      ]);
    }
    revalidatePath("/dashboard", "layout");
    revalidatePath("/app", "layout");
    revalidatePath("/articles/[slug]", "page");
    return { ok: true };
  });
}
