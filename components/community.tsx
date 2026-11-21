"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addComment, addPost, reportContent, toggleBlock } from "@/app/actions/community";
import { FieldError, FormMessage, SubmitButton } from "@/components/forms";
import { copy } from "@/content/copy";
import type { ActionState } from "@/lib/validation";

const initial: ActionState = {};

/** Resets the form after a successful submit. */
function useResetOnSuccess(state: ActionState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

export function CommentForm({ articleId }: { articleId: string }) {
  const [state, action] = useActionState(addComment, initial);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="mt-6">
      <input type="hidden" name="articleId" value={articleId} />
      <label htmlFor="comment-body" className="label">
        {copy.comments.label}
      </label>
      <textarea
        id="comment-body"
        name="body"
        rows={3}
        maxLength={2000}
        required
        className="input"
        aria-invalid={!!state.errors?.body || undefined}
        aria-describedby={state.errors?.body ? "e-comment" : undefined}
      />
      <FieldError id="e-comment" message={state.errors?.body} />
      <SubmitButton className="btn btn-accent btn-sm mt-3">{copy.comments.submit}</SubmitButton>
      <FormMessage state={state.ok ? {} : state} />
    </form>
  );
}

export function PostForm({ parentId }: { parentId?: string }) {
  const [state, action] = useActionState(addPost, initial);
  const ref = useResetOnSuccess(state);
  const t = copy.discussion;
  const id = parentId ? `reply-${parentId}` : "post-body";
  return (
    <form ref={ref} action={action} className={parentId ? "mt-3" : ""}>
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <label htmlFor={id} className={parentId ? "sr-only" : "label"}>
        {parentId ? t.replyLabel : t.label}
      </label>
      <textarea
        id={id}
        name="body"
        rows={parentId ? 2 : 3}
        maxLength={2000}
        required
        placeholder={parentId ? t.replyLabel : undefined}
        className="input"
      />
      <FieldError id={`${id}-e`} message={state.errors?.body} />
      <SubmitButton className={`btn btn-accent btn-sm mt-3`}>{parentId ? t.reply : t.submit}</SubmitButton>
      <FormMessage state={state.ok ? {} : state} />
    </form>
  );
}

export function ReportButton({ targetType, targetId }: { targetType: "comment" | "post"; targetId: string }) {
  const [state, action] = useActionState(reportContent, initial);
  const [open, setOpen] = useState(false);
  const t = copy.discussion;
  if (state.ok) return <p className="text-sm text-brown">{t.reported}</p>;
  return (
    <div>
      <button type="button" className="link text-sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {t.report}
      </button>
      {open && (
        <form action={action} className="mt-2">
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <label htmlFor={`reason-${targetId}`} className="hint block">
            {t.reportReason}
          </label>
          <input id={`reason-${targetId}`} name="reason" required maxLength={500} className="input text-base" />
          <FieldError id={`reason-e-${targetId}`} message={state.errors?.reason} />
          <SubmitButton className="btn-ghost mt-2">{t.reportSubmit}</SubmitButton>
          <FormMessage state={state} />
        </form>
      )}
    </div>
  );
}

export function BlockButton({ userId, blocked }: { userId: string; blocked?: boolean }) {
  const [state, action] = useActionState(toggleBlock, initial);
  const t = copy.discussion;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!blocked && !window.confirm(t.blockConfirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton className="link text-sm">{blocked ? t.unblock : t.block}</SubmitButton>
      {!state.ok && state.message && <p className="text-sm text-error">{state.message}</p>}
    </form>
  );
}

export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "X", href: `https://x.com/intent/post?text=${t}&url=${u}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm uppercase tracking-[0.2em] text-gold-dark">{copy.articles.share}</span>
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className="btn-ghost">
          {l.name}
        </a>
      ))}
      <button
        type="button"
        className="btn-ghost"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {}
        }}
      >
        {copied ? copy.articles.copied : copy.articles.copyLink}
      </button>
    </div>
  );
}
