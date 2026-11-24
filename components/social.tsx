"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { connect, disconnect, respond, sendMessage } from "@/app/actions/social";
import { copy } from "@/content/copy";
import type { ActionState } from "@/lib/validation";

const t = copy.social;
const initial: ActionState = {};

function Submit({ className, children, name, value }: { className: string; children: React.ReactNode; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={`${className} disabled:opacity-60`}>
      {children}
    </button>
  );
}

function Error({ state }: { state: ActionState }) {
  return !state.ok && state.message ? <p className="mt-1 text-sm text-error">{state.message}</p> : null;
}

/** Connect / Requested / Accept + Decline, depending on how the viewer relates to this member. */
export function ConnectButton({
  userId,
  relation,
  connectionId,
  size = "sm",
}: {
  userId: string;
  relation: "none" | "sent" | "received" | "connected";
  connectionId?: string;
  size?: "sm" | "lg";
}) {
  const [cState, connectAction] = useActionState(connect, initial);
  const [rState, respondAction] = useActionState(respond, initial);
  const [dState, disconnectAction] = useActionState(disconnect, initial);
  const btn = size === "lg" ? "btn" : "btn btn-sm";

  if (relation === "received" && connectionId) {
    return (
      <form action={respondAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="connectionId" value={connectionId} />
        <Submit className={btn} name="decision" value="accept">
          {t.accept}
        </Submit>
        <Submit className={`${btn} btn-alt`} name="decision" value="decline">
          {t.decline}
        </Submit>
        <Error state={rState} />
      </form>
    );
  }
  if (relation === "sent") {
    return (
      <form action={disconnectAction}>
        <input type="hidden" name="userId" value={userId} />
        <Submit className={`${btn} btn-alt`}>{t.requested}</Submit>
        <Error state={dState} />
      </form>
    );
  }
  if (relation === "connected") return null;
  return (
    <form action={connectAction}>
      <input type="hidden" name="userId" value={userId} />
      <Submit className={btn}>{t.connect}</Submit>
      <Error state={cState} />
    </form>
  );
}

/** Small text button: withdraw a request or remove a connection. */
export function DisconnectButton({ userId, label, confirm }: { userId: string; label: string; confirm?: string }) {
  const [state, action] = useActionState(disconnect, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <Submit className="link text-sm">{label}</Submit>
      <Error state={state} />
    </form>
  );
}

/** The message box at the bottom of a conversation. Enter sends; Shift+Enter adds a line. */
export function MessageComposer({ to }: { to: string }) {
  const [state, action] = useActionState(sendMessage, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="app-composer fixed inset-x-0 z-30 border-t border-line bg-ivory px-4 py-3">
      <input type="hidden" name="to" value={to} />
      <div className="mx-auto flex max-w-xl items-end gap-2">
        <label htmlFor="m-body" className="sr-only">
          {t.write}
        </label>
        <textarea
          id="m-body"
          name="body"
          rows={1}
          maxLength={2000}
          required
          placeholder={t.write}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !window.matchMedia("(pointer: coarse)").matches) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="max-h-32 min-h-11 flex-1 resize-none border border-ink/25 bg-paper/60 px-3 py-2.5 text-base outline-none focus:border-ink"
        />
        <Submit className="btn min-h-11 px-5">{t.send}</Submit>
      </div>
      <Error state={state} />
    </form>
  );
}

/** Re-reads the screen every few seconds while it is visible, so new messages appear. */
export function LiveRefresh({ every = 4000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const id = window.setInterval(tick, every);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, every]);
  return null;
}

/** Keeps a conversation scrolled to the newest message: on open, and when one arrives while you're near the bottom. */
export function ScrollToEnd({ count }: { count: number }) {
  const first = useRef(true);
  useEffect(() => {
    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 240;
    if (first.current || nearBottom) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [count]);
  return null;
}
