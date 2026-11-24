"use client";

import { useActionState } from "react";
import {
  adminDeleteMessage,
  adminDeleteRequest,
  adminEditMessage,
  adminEditRequest,
  adminSetRepliesLocked,
  replyToRequest,
} from "@/app/actions/concierge";
import { FieldError, FormMessage, SubmitButton } from "@/components/forms";
import { conciergeCategories } from "@/config/site";
import { copy } from "@/content/copy";
import type { ActionState } from "@/lib/validation";

const initial: ActionState = {};

/** Status, and an optional message the member sees in their app. */
export function ReplyForm({ id, status }: { id: string; status: string }) {
  const [state, action] = useActionState(replyToRequest, initial);
  const labels = copy.app.concierge.status;
  return (
    <form action={action} className="mt-4 space-y-3 border-t border-gold/30 pt-4">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="text-sm text-mute">Reply to the member (shown in their app)</span>
        <textarea name="message" rows={3} maxLength={2000} className="input mt-1" placeholder="Write a reply…" />
      </label>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm text-mute">Status</span>
          <select name="status" defaultValue={status} className="input mt-1 py-1 text-base">
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton className="btn btn-sm">Send</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/** Edit a request's topic, details, city, date and people. */
export function EditRequestForm({
  request,
}: {
  request: { id: string; category: string; details: string; city: string | null; date: string | null; people: number | null };
}) {
  const [state, action] = useActionState(adminEditRequest, initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="id" value={request.id} />
      <label className="block sm:col-span-6">
        <span className="text-sm text-mute">Topic</span>
        <select name="category" defaultValue={request.category} className="input mt-1">
          {conciergeCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-6">
        <span className="text-sm text-mute">Request</span>
        <textarea name="details" defaultValue={request.details} rows={3} maxLength={2000} required className="input mt-1" />
        <FieldError id={`e-d-${request.id}`} message={e.details} />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm text-mute">City</span>
        <input name="city" defaultValue={request.city ?? ""} maxLength={80} className="input mt-1" />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm text-mute">When</span>
        <input name="date" defaultValue={request.date ?? ""} maxLength={80} className="input mt-1" />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-sm text-mute">People</span>
        <input name="people" type="number" min={1} max={50} defaultValue={request.people ?? ""} className="input mt-1" />
        <FieldError id={`e-p-${request.id}`} message={e.people} />
      </label>
      <div className="sm:col-span-6">
        <SubmitButton className="btn btn-sm">Save request</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

/** Lock or unlock member replies. */
export function LockButton({ id, locked }: { id: string; locked: boolean }) {
  const [state, action] = useActionState(adminSetRepliesLocked, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locked" value={locked ? "0" : "1"} />
      <SubmitButton className="btn btn-sm btn-alt">{locked ? "Unlock replies" : "Lock replies"}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteRequestButton({ id }: { id: string }) {
  const [state, action] = useActionState(adminDeleteRequest, initial);
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm("Delete this request and its whole conversation? This can't be undone.")) ev.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton className="btn btn-sm btn-alt text-error">Delete request</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

/** One message in the thread, with Edit and Delete. */
export function MessageItem({ message }: { message: { id: string; body: string; fromTeam: boolean; when: string; edited: boolean } }) {
  const [editState, editAction] = useActionState(adminEditMessage, initial);
  const [delState, delAction] = useActionState(adminDeleteMessage, initial);
  return (
    <li className={`border-l-2 py-2 pl-3 ${message.fromTeam ? "border-gold" : "border-ink/40"}`}>
      <p className="text-xs text-mute">
        {message.fromTeam ? "Request Desk" : "Member"} · {message.when}
        {message.edited && " · edited"}
      </p>
      <p className="mt-1 whitespace-pre-line">{message.body}</p>
      <div className="mt-1 flex flex-wrap items-start gap-4">
        <details>
          <summary className="link cursor-pointer text-sm">Edit</summary>
          <form action={editAction} className="mt-2 space-y-2">
            <input type="hidden" name="messageId" value={message.id} />
            <textarea name="body" defaultValue={message.body} rows={3} maxLength={2000} className="input" />
            <SubmitButton className="btn btn-sm">Save</SubmitButton>
            <FormMessage state={editState} />
          </form>
        </details>
        <form
          action={delAction}
          onSubmit={(ev) => {
            if (!window.confirm("Delete this message?")) ev.preventDefault();
          }}
        >
          <input type="hidden" name="messageId" value={message.id} />
          <SubmitButton className="link text-sm text-error">Delete</SubmitButton>
          <FormMessage state={delState} />
        </form>
      </div>
    </li>
  );
}
