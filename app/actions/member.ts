"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { copy } from "@/content/copy";
import { paymentMethods, proPriceOf } from "@/config/pricing";
import { assertOnboarded, assertViewer } from "@/lib/access";
import { runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { fieldErrors, onboardingSchema, parseContact, paymentSchema, type ActionState } from "@/lib/validation";

export async function completeOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await assertViewer().catch(() => null);
  if (!viewer) return { message: "Please sign in again." };

  const result = await runAction(
    "onboarding",
    { max: 10, windowSeconds: 600 },
    async (): Promise<ActionState> => {
      const parsed = onboardingSchema.safeParse({
        field: formData.get("field"),
        name: formData.get("name"),
        city: formData.get("city"),
        contact: formData.get("contact"),
        perks: formData.getAll("perks"),
        helpBuild: formData.get("helpBuild"),
        contribution: formData.get("contribution") ?? "",
      });
      if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the highlighted answers." };
      const v = parsed.data;

      const field = await db.field.findUnique({ where: { slug: v.field } });
      if (!field) return { errors: { field: "Please choose your field." } };

      const contact = parseContact(v.contact)!.normalized;
      const answers = {
        fieldId: field.id,
        name: v.name,
        city: v.city,
        contact,
        perks: v.perks,
        helpBuild: v.helpBuild,
        contribution: v.contribution || null,
      };

      await db.$transaction([
        db.application.upsert({
          where: { userId: viewer.user.id },
          create: { userId: viewer.user.id, ...answers },
          update: answers,
        }),
        db.user.update({
          where: { id: viewer.user.id },
          data: {
            name: v.name,
            city: v.city,
            contact,
            // An admin may have moved the member already; onboarding only sets the first field.
            fieldId: viewer.user.fieldId ?? field.id,
            onboardedAt: viewer.user.onboardedAt ?? new Date(),
          },
        }),
      ]);
      return { ok: true };
    },
    viewer.user.id,
  );

  // Onboarding gives no access by itself: next step is paying for membership.
  if (result.ok) redirect("/dashboard/membership");
  return result;
}

export async function submitPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await assertOnboarded().catch(() => null);
  if (!viewer) return { message: "Please sign in and finish onboarding first." };

  return runAction(
    "payment",
    { max: 5, windowSeconds: 600 },
    async (): Promise<ActionState> => {
      const parsed = paymentSchema.safeParse({
        cycle: formData.get("cycle"),
        method: formData.get("method"),
        reference: formData.get("reference") ?? "",
        screenshot: formData.get("screenshot") ?? undefined,
      });
      if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the highlighted fields." };
      const v = parsed.data;
      if (!paymentMethods[v.method].available) return { errors: { method: "Please choose eSewa or Khalti." } };

      const pending = await db.payment.findFirst({ where: { userId: viewer.user.id, status: "PENDING" } });
      if (pending) return { message: copy.join.pendingBlock };

      const screenshot = v.screenshot ? new Uint8Array(await v.screenshot.arrayBuffer()) : null;

      await db.subscription.create({
        data: {
          userId: viewer.user.id,
          package: "PRO", // the one paid plan, shown as "Member"
          billingCycle: v.cycle,
          status: "PENDING_PAYMENT",
          payments: {
            create: {
              userId: viewer.user.id,
              // Amount always comes from server config, never from the form.
              amount: proPriceOf(v.cycle),
              method: v.method,
              reference: v.reference,
              screenshot,
              screenshotType: v.screenshot?.type ?? null,
            },
          },
        },
      });

      revalidatePath("/dashboard", "layout");
      return { ok: true, message: copy.join.success };
    },
    viewer.user.id,
  );
}
