"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/validation";

export function SubmitButton({
  children,
  pending,
  className = "btn",
  name,
  value,
}: {
  children: React.ReactNode;
  pending?: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
}) {
  const status = useFormStatus();
  return (
    <button type="submit" disabled={status.pending} className={className} name={name} value={value}>
      {status.pending && pending ? pending : children}
    </button>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-error">
      {message}
    </p>
  );
}

export function FormMessage({ state }: { state: { ok?: boolean; message?: string } }) {
  return (
    <div aria-live="polite">
      {state.message && <p className={state.ok ? "mt-3 text-brown" : "mt-3 text-error"}>{state.message}</p>}
    </div>
  );
}

/** Radio or checkbox group rendered as chips, with a proper fieldset/legend. */
export function Chips({
  name,
  legend,
  hint,
  options,
  type = "radio",
  defaultValue,
  error,
  required,
  stacked,
  onChange,
}: {
  name: string;
  legend: React.ReactNode;
  hint?: string;
  options: readonly { value: string; label: string }[];
  type?: "radio" | "checkbox";
  defaultValue?: string | string[];
  error?: string;
  required?: boolean;
  stacked?: boolean;
  onChange?: (value: string, checked: boolean) => void;
}) {
  const describedBy = [hint && `h-${name}`, error && `e-${name}`].filter(Boolean).join(" ") || undefined;
  const isDefault = (v: string) => (Array.isArray(defaultValue) ? defaultValue.includes(v) : defaultValue === v);
  return (
    <fieldset aria-describedby={describedBy} aria-invalid={!!error || undefined}>
      <legend className="label">
        {legend} {required && <Req />}
      </legend>
      {hint && (
        <p id={`h-${name}`} className="hint">
          {hint}
        </p>
      )}
      <div className={`mt-3 ${stacked ? "flex flex-col items-start gap-2" : "flex flex-wrap gap-2"}`}>
        {options.map((o, i) => (
          <label key={o.value} className="chip">
            <input
              id={i === 0 ? `f-${name}` : undefined}
              type={type}
              name={name}
              value={o.value}
              defaultChecked={isDefault(o.value)}
              className="peer sr-only"
              onChange={(e) => onChange?.(o.value, e.target.checked)}
            />
            <span className="chip-face">{o.label}</span>
          </label>
        ))}
      </div>
      <FieldError id={`e-${name}`} message={error} />
    </fieldset>
  );
}

/** Single-choice card grid for picking a member's field: name, one-line description, field accent. */
export function FieldPicker({
  name,
  legend,
  hint,
  options,
  error,
  onChange,
}: {
  name: string;
  legend: React.ReactNode;
  hint?: string;
  options: readonly { value: string; label: string; description: string; accent: string; tint: string }[];
  error?: string;
  onChange?: (value: string) => void;
}) {
  const describedBy = [hint && `h-${name}`, error && `e-${name}`].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset aria-describedby={describedBy} aria-invalid={!!error || undefined}>
      <legend className="label">
        {legend} <Req />
      </legend>
      {hint && (
        <p id={`h-${name}`} className="hint">
          {hint}
        </p>
      )}
      {options.length === 0 ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-base">
          Fields are being set up. Please refresh in a moment.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((o, i) => (
            <label
              key={o.value}
              className="group relative flex cursor-pointer gap-4 rounded-xl border border-gold/35 bg-white/70 p-4 transition hover:border-[var(--fp-accent)] hover:shadow-sm has-[:checked]:border-[var(--fp-accent)] has-[:checked]:bg-[var(--fp-tint)]/40 has-[:checked]:shadow-md has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-dark"
              style={{ "--fp-accent": o.accent, "--fp-tint": o.tint } as React.CSSProperties}
            >
              <input
                id={i === 0 ? `f-${name}` : undefined}
                type="radio"
                name={name}
                value={o.value}
                required
                className="peer sr-only"
                onChange={() => onChange?.(o.value)}
              />
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                style={{ backgroundColor: o.accent }}
              >
                {o.label.charAt(0)}
              </span>
              <span className="min-w-0 flex-1 pr-6">
                <span className="block text-lg font-semibold leading-tight text-brown">{o.label}</span>
                <span className="mt-1 block text-[0.95rem] leading-snug text-ink">{o.description}</span>
              </span>
              <span
                aria-hidden="true"
                className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border border-gold/50 text-white transition peer-checked:border-transparent peer-checked:bg-[var(--fp-accent)]"
              >
                <svg viewBox="0 0 16 16" className="h-3 w-3 opacity-0 transition group-has-[:checked]:opacity-100" fill="none">
                  <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </label>
          ))}
        </div>
      )}
      <FieldError id={`e-${name}`} message={error} />
    </fieldset>
  );
}

export function Req() {
  return (
    <span className="text-gold-dark">
      <span aria-hidden="true">*</span>
      <span className="sr-only">(required)</span>
    </span>
  );
}

/**
 * Like useActionState, but submits via onSubmit so React does not reset the
 * form's fields when the server returns validation errors.
 */
export function useKeepValuesAction(fn: (prev: ActionState, data: FormData) => Promise<ActionState>) {
  const [state, action, pending] = useActionState(fn, {} as ActionState);
  const [, startTransition] = useTransition();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
  return [state, onSubmit, pending] as const;
}

export function PendingButton({
  pending,
  children,
  pendingLabel,
  className = "btn",
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
