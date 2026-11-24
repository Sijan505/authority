"use client";

import { useActionState } from "react";
import { deleteShareholder, finalizeMonth, reopenMonth, saveShareholder } from "@/app/actions/revenue";
import { FieldError, FormMessage, SubmitButton } from "@/components/forms";
import type { ActionState } from "@/lib/validation";

const initial: ActionState = {};
export const ROLE_LABEL = { OWNER: "Owner", TECHNICAL_PARTNER: "Technical partner" } as const;

/** Add a shareholder, or edit one (pass `holder`). */
export function ShareholderForm({ holder }: { holder?: { id: string; name: string; role: "OWNER" | "TECHNICAL_PARTNER"; percent: string } }) {
  const [state, action] = useActionState(saveShareholder, initial);
  const e = state.errors ?? {};
  const key = holder?.id ?? "new";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_12rem_8rem_auto] sm:items-end">
      {holder && <input type="hidden" name="id" value={holder.id} />}
      <label className="block">
        <span className="text-sm text-mute">Name</span>
        <input name="name" defaultValue={holder?.name} maxLength={120} required className="input mt-1" aria-invalid={!!e.name || undefined} />
        <FieldError id={`e-name-${key}`} message={e.name} />
      </label>
      <label className="block">
        <span className="text-sm text-mute">Role</span>
        <select name="role" defaultValue={holder?.role ?? "OWNER"} className="input mt-1">
          {Object.entries(ROLE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm text-mute">Ownership %</span>
        <input name="percent" defaultValue={holder?.percent} inputMode="decimal" placeholder="e.g. 35.50" required className="input mt-1" aria-invalid={!!e.percent || undefined} />
        <FieldError id={`e-percent-${key}`} message={e.percent} />
      </label>
      <div>
        <SubmitButton className="btn btn-sm">{holder ? "Save" : "Add shareholder"}</SubmitButton>
      </div>
      <div className="sm:col-span-4">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function DeleteShareholder({ id, name }: { id: string; name: string }) {
  const [state, action] = useActionState(deleteShareholder, initial);
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm(`Remove ${name}? Finalised months keep their amounts.`)) ev.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton className="link text-sm text-error">Remove</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

/** Finalise or reopen one month. */
export function PeriodAction({ month, label, mode }: { month: string; label: string; mode: "finalize" | "reopen" }) {
  const [state, action] = useActionState(mode === "finalize" ? finalizeMonth : reopenMonth, initial);
  const confirmText =
    mode === "finalize"
      ? `Finalise ${label}? The amounts are saved with today's ownership percentages.`
      : `Reopen ${label}? Its saved amounts are cleared until you finalise it again.`;
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm(confirmText)) ev.preventDefault();
      }}
    >
      <input type="hidden" name="month" value={month} />
      <SubmitButton className={mode === "finalize" ? "btn btn-sm" : "btn btn-sm btn-alt"}>
        {mode === "finalize" ? "Finalise" : "Reopen"}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
