"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { replyAsMember } from "@/app/actions/concierge";
import { copy } from "@/content/copy";
import type { ActionState } from "@/lib/validation";

function Send() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn min-h-11 px-5 disabled:opacity-60">
      {copy.social.send}
    </button>
  );
}

/** The member's reply box on a Request Desk conversation. Enter sends; Shift+Enter adds a line. */
export function ConciergeComposer({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(replyAsMember, {} as ActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="app-composer fixed inset-x-0 z-30 border-t border-line bg-ivory px-4 py-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="mx-auto flex max-w-xl items-end gap-2">
        <label htmlFor="c-reply" className="sr-only">
          {copy.app.concierge.replyLabel}
        </label>
        <textarea
          id="c-reply"
          name="body"
          rows={1}
          maxLength={2000}
          required
          placeholder={copy.app.concierge.replyLabel}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !window.matchMedia("(pointer: coarse)").matches) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="max-h-32 min-h-11 flex-1 resize-none border border-ink/25 bg-paper/60 px-3 py-2.5 text-base outline-none focus:border-ink"
        />
        <Send />
      </div>
      {!state.ok && state.message && <p className="mx-auto mt-1 max-w-xl text-sm text-error">{state.message}</p>}
    </form>
  );
}
