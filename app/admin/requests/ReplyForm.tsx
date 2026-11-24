"use client";

import { replyToRequest } from "@/app/actions/concierge";
import { FormMessage, PendingButton, useKeepValuesAction } from "@/components/forms";
import { copy } from "@/content/copy";

/** Status and reply for one Request Desk request. */
export function ReplyForm({ id, status, reply }: { id: string; status: string; reply: string }) {
  const [state, onSubmit, pending] = useKeepValuesAction(replyToRequest);
  const labels = copy.app.concierge.status;
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t border-gold/30 pt-4">
      <input type="hidden" name="id" value={id} />
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
      <label className="block">
        <span className="text-sm text-mute">Reply to the member (shown in their app)</span>
        <textarea name="reply" defaultValue={reply} rows={3} maxLength={2000} className="input mt-1" />
      </label>
      <PendingButton pending={pending} pendingLabel="Saving…" className="btn btn-sm">
        Save
      </PendingButton>
      <FormMessage state={state} />
    </form>
  );
}
