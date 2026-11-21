"use client";

import { useActionState } from "react";
import { deleteArticle, deleteOffer, moderate, reviewPayment, saveArticle, saveOffer, updateMember } from "@/app/actions/admin";
import { FieldError, FormMessage, PendingButton, SubmitButton, useKeepValuesAction } from "@/components/forms";
import type { ActionState } from "@/lib/validation";

type Option = { value: string; label: string };
const initial: ActionState = {};

export function ReviewPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, action] = useActionState(reviewPayment, initial);
  if (state.ok) return <p className="text-brown">{state.message}</p>;
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="paymentId" value={paymentId} />
      <label htmlFor={`note-${paymentId}`} className="sr-only">
        Note
      </label>
      <input id={`note-${paymentId}`} name="note" maxLength={500} placeholder="Note (optional)" className="input mt-0 text-base" />
      <div className="flex gap-2">
        <SubmitButton name="decision" value="verify" className="btn btn-sm">
          Verify
        </SubmitButton>
        <SubmitButton name="decision" value="reject" className="btn-ghost">
          Reject
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function MemberForm({
  userId,
  fieldId,
  status,
  hasPro,
  fields,
}: {
  userId: string;
  fieldId: string | null;
  status: string;
  hasPro: boolean;
  fields: Option[];
}) {
  const [state, action] = useActionState(updateMember, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="text-sm">
        Field
        <select name="fieldId" defaultValue={fieldId ?? ""} className="input mt-1 py-1 text-base">
          {!fieldId && <option value="">—</option>}
          {fields.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Package
        {/* Pro is granted by verifying a payment; here an admin can only end Pro early. */}
        <select name="package" defaultValue={hasPro ? "PRO" : "BASIC"} disabled={!hasPro} className="input mt-1 py-1 text-base">
          <option value="BASIC">Basic (free)</option>
          {hasPro && <option value="PRO">Pro</option>}
        </select>
      </label>
      <label className="text-sm">
        Status
        <select name="status" defaultValue={status} className="input mt-1 py-1 text-base">
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </label>
      <SubmitButton className="btn btn-sm">Save</SubmitButton>
      <div className="w-full">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function ModerationForm({ reportId }: { reportId: string }) {
  const [state, action] = useActionState(moderate, initial);
  if (state.ok) return <p className="text-brown">{state.message}</p>;
  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <SubmitButton name="action" value="remove" className="btn btn-sm">
        Remove content
      </SubmitButton>
      <SubmitButton name="action" value="suspend" className="btn-ghost">
        Remove + suspend author
      </SubmitButton>
      <SubmitButton name="action" value="dismiss" className="btn-ghost">
        Dismiss
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

type ArticleValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  fieldId: string;
  authorName: string;
  tags: string;
  published: boolean;
};

function Text({
  name,
  label,
  defaultValue,
  error,
  hint,
  rows,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  rows?: number;
  type?: string;
}) {
  const props = {
    id: `f-${name}`,
    name,
    defaultValue,
    className: "input",
    "aria-invalid": !!error || undefined,
    "aria-describedby": [hint && `h-${name}`, error && `e-${name}`].filter(Boolean).join(" ") || undefined,
  };
  return (
    <div>
      <label htmlFor={`f-${name}`} className="label">
        {label}
      </label>
      {hint && (
        <p id={`h-${name}`} className="hint">
          {hint}
        </p>
      )}
      {rows ? <textarea rows={rows} {...props} /> : <input type={type} {...props} />}
      <FieldError id={`e-${name}`} message={error} />
    </div>
  );
}

function FieldSelect({ fields, defaultValue, error }: { fields: Option[]; defaultValue: string; error?: string }) {
  return (
    <div>
      <label htmlFor="f-fieldId" className="label">
        Field
      </label>
      <select id="f-fieldId" name="fieldId" defaultValue={defaultValue} className="input" aria-invalid={!!error || undefined}>
        {fields.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <FieldError id="e-fieldId" message={error} />
    </div>
  );
}

export function ArticleForm({ values, fields }: { values: ArticleValues; fields: Option[] }) {
  const [state, onSubmit, pending] = useKeepValuesAction(saveArticle);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Text name="title" label="Title" defaultValue={values.title} error={e.title} />
      <Text name="slug" label="Slug" defaultValue={values.slug} error={e.slug} hint="Leave empty to generate from the title." />
      <div className="grid gap-6 sm:grid-cols-2">
        <FieldSelect fields={fields} defaultValue={values.fieldId} error={e.fieldId} />
        <Text name="authorName" label="Author" defaultValue={values.authorName} error={e.authorName} />
      </div>
      <Text name="tags" label="Tags" defaultValue={values.tags} hint="Comma-separated." error={e.tags} />
      <Text name="excerpt" label="Excerpt (public)" rows={3} defaultValue={values.excerpt} error={e.excerpt} />
      <Text
        name="body"
        label="Body (members only)"
        rows={16}
        defaultValue={values.body}
        error={e.body}
        hint="Plain text. Leave a blank line between paragraphs."
      />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="publish" defaultChecked={values.published} className="h-4 w-4" />
        Published
      </label>
      <FormMessage state={state} />
      <PendingButton pending={pending} pendingLabel="Saving…">
        Save article
      </PendingButton>
    </form>
  );
}

type OfferValues = {
  id?: string;
  fieldId: string;
  name: string;
  venue: string;
  discountText: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
};

export function OfferForm({ values, fields }: { values: OfferValues; fields: Option[] }) {
  const [state, onSubmit, pending] = useKeepValuesAction(saveOffer);
  const e = state.errors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <FieldSelect fields={fields} defaultValue={values.fieldId} error={e.fieldId} />
      <Text name="name" label="Offer name" defaultValue={values.name} error={e.name} />
      <Text name="venue" label="Venue" defaultValue={values.venue} error={e.venue} />
      <Text name="discountText" label="Discount text" defaultValue={values.discountText} error={e.discountText} hint="e.g. 15% off the tasting menu" />
      <div className="grid gap-6 sm:grid-cols-2">
        <Text name="validFrom" type="date" label="Valid from" defaultValue={values.validFrom} error={e.validFrom} />
        <Text name="validUntil" type="date" label="Valid until" defaultValue={values.validUntil} error={e.validUntil} />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="active" defaultChecked={values.active} className="h-4 w-4" />
        Active (shown to members)
      </label>
      <FormMessage state={state} />
      <PendingButton pending={pending} pendingLabel="Saving…">
        Save offer
      </PendingButton>
    </form>
  );
}

type DeleteProps = { id: string; title: string; className?: string };

export function DeleteArticleButton(props: DeleteProps) {
  return (
    <ConfirmDeleteButton
      {...props}
      action={deleteArticle}
      message={`Delete "${props.title}"? Its comments will be deleted too. This can't be undone.`}
    />
  );
}

export function DeleteOfferButton(props: DeleteProps) {
  return <ConfirmDeleteButton {...props} action={deleteOffer} message={`Delete the offer "${props.title}"? This can't be undone.`} />;
}

/** Delete button that asks for confirmation before submitting. */
function ConfirmDeleteButton({
  id,
  action,
  message,
  className = "btn-ghost text-red-700",
}: DeleteProps & { action: (formData: FormData) => Promise<void>; message: string }) {
  return (
    <form
      action={action}
      className="inline"
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        Delete
      </button>
    </form>
  );
}
