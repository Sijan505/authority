"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { connect, disconnect, editMessage, removeGroupMessage, respond, sendGroupMessage, sendMessage, unsendMessage } from "@/app/actions/social";
import { MESSAGE_EDIT_MINUTES } from "@/config/site";
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
export function MessageComposer({ to }: { to?: string }) {
  // Without a recipient it posts to the members' group chat.
  const [state, action] = useActionState(to ? sendMessage : sendGroupMessage, initial);
  const placeholder = to ? t.write : copy.group.write;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="app-composer fixed inset-x-0 z-30 border-t border-line bg-ivory px-4 py-3">
      {to && <input type="hidden" name="to" value={to} />}
      <div className="mx-auto flex max-w-xl items-end gap-2">
        <label htmlFor="m-body" className="sr-only">
          {placeholder}
        </label>
        <textarea
          id="m-body"
          name="body"
          rows={1}
          maxLength={2000}
          required
          placeholder={placeholder}
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

/**
 * Wraps a message bubble with Instagram-style actions. Long-press it (or right-click,
 * or the ⋯ button on a computer) for: Edit (your own, within MESSAGE_EDIT_MINUTES),
 * Unsend (your own, any time) and, for admins in the group, Remove.
 */
export function MessageMenu({
  kind,
  messageId,
  body,
  sentAt,
  mine,
  canRemove = false,
  className = "",
  children,
}: {
  kind: "dm" | "group";
  messageId: string;
  body: string;
  sentAt: string;
  mine: boolean;
  canRemove?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const press = useRef<number | null>(null);

  // Close the menu on a tap elsewhere, or Escape.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!mine && !canRemove) return <div className={className}>{children}</div>;

  const openMenu = () => {
    setCanEdit(mine && Date.now() - Date.parse(sentAt) < MESSAGE_EDIT_MINUTES * 60_000);
    setError(null);
    setOpen(true);
  };
  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current);
    press.current = null;
  };
  const run = (fn: () => Promise<{ ok?: boolean; message?: string }>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setOpen(false);
        after?.();
      } else setError(res.message ?? copy.errors.generic);
    });

  const unsend = () => {
    if (!window.confirm(t.unsendConfirm)) return;
    run(() => unsendMessage({ kind, messageId }));
  };
  const remove = () => {
    if (!window.confirm(copy.group.removeConfirm)) return;
    const fd = new FormData();
    fd.set("messageId", messageId);
    run(() => removeGroupMessage(initial, fd));
  };
  const save = (form: HTMLFormElement) => {
    const next = String(new FormData(form).get("body") ?? "").trim();
    run(() => editMessage({ kind, messageId, body: next }), () => setEditing(false));
  };

  if (editing) {
    return (
      <form
        className={`w-80 max-w-[85%] ${mine ? "ml-auto" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          save(e.currentTarget);
        }}
      >
        <label htmlFor={`edit-${messageId}`} className="mb-1 block text-[0.625rem] tracking-[0.14em] text-mute uppercase">
          {t.editing}
        </label>
        <textarea
          id={`edit-${messageId}`}
          name="body"
          defaultValue={body}
          rows={3}
          maxLength={2000}
          required
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
            if (e.key === "Enter" && !e.shiftKey && !window.matchMedia("(pointer: coarse)").matches) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="w-full resize-none border border-ink/40 bg-paper/80 px-3 py-2 text-base outline-none focus:border-ink"
        />
        <div className="mt-1.5 flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className="min-h-9 px-3 text-sm text-mute hover:text-ink">
            {t.cancel}
          </button>
          <button type="submit" disabled={pending} className="btn min-h-9 px-4 text-sm disabled:opacity-60">
            {t.save}
          </button>
        </div>
        {error && <p className="mt-1 text-right text-sm text-error">{error}</p>}
      </form>
    );
  }

  return (
    <div
      ref={ref}
      className={`group relative [-webkit-touch-callout:none] [@media(pointer:coarse)]:select-none ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu();
      }}
      onTouchStart={() => {
        cancelPress();
        press.current = window.setTimeout(openMenu, 450);
      }}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
    >
      <div className={`transition-transform ${open ? "scale-[0.98]" : ""}`}>{children}</div>
      <button
        type="button"
        aria-label={t.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-mute opacity-0 group-hover:opacity-100 hover:bg-ink/5 hover:text-ink focus-visible:opacity-100 ${
          mine ? "right-full mr-1" : "left-full ml-1"
        }`}
      >
        ⋯
      </button>
      {open && (
        <div role="menu" className={`absolute top-full z-30 mt-1 min-w-40 border border-line bg-ivory py-1 text-ink shadow-lg ${mine ? "right-0" : "left-0"}`}>
          {canEdit && (
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setEditing(true);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ink/5"
            >
              {t.edit}
            </button>
          )}
          {mine && (
            <button type="button" role="menuitem" disabled={pending} onClick={unsend} className="block w-full px-4 py-2.5 text-left text-sm text-error hover:bg-ink/5">
              {t.unsend}
            </button>
          )}
          {!mine && canRemove && (
            <button type="button" role="menuitem" disabled={pending} onClick={remove} className="block w-full px-4 py-2.5 text-left text-sm text-error hover:bg-ink/5">
              {copy.group.remove}
            </button>
          )}
          {error && <p className="px-4 pb-2 text-xs text-error">{error}</p>}
        </div>
      )}
    </div>
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
