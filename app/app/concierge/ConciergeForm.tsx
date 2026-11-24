"use client";

import { useEffect, useRef, useState } from "react";
import { submitRequest } from "@/app/actions/concierge";
import { FieldError, FormMessage, PendingButton, useKeepValuesAction } from "@/components/forms";
import { conciergeCategories } from "@/config/site";
import { copy } from "@/content/copy";

const t = copy.app.concierge;

/** New request for the Request Desk. Clears itself after a successful send. */
export function ConciergeForm({ initialCategory }: { initialCategory: string }) {
  const [state, onSubmit, pending] = useKeepValuesAction(submitRequest);
  const [category, setCategory] = useState(initialCategory);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset>
        <legend className="text-[0.6875rem] font-semibold tracking-[0.2em] text-mute uppercase">{t.category}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {conciergeCategories.map((c) => (
            <label key={c} className={`cursor-pointer border px-3.5 py-2 text-sm transition-colors ${category === c ? "border-ink bg-ink text-ivory" : "border-ink/25 hover:border-ink"}`}>
              <input type="radio" name="category" value={c} checked={category === c} onChange={() => setCategory(c)} className="sr-only" />
              {c}
            </label>
          ))}
        </div>
        <FieldError id="e-category" message={errors.category} />
      </fieldset>

      <div>
        <label htmlFor="c-details" className="text-[0.6875rem] font-semibold tracking-[0.2em] text-mute uppercase">
          {t.details}
        </label>
        <p id="h-details" className="mt-1 text-sm text-mute">
          {t.detailsHint}
        </p>
        <textarea
          id="c-details"
          name="details"
          rows={4}
          maxLength={2000}
          required
          aria-invalid={!!errors.details || undefined}
          aria-describedby={`h-details${errors.details ? " e-details" : ""}`}
          className="mt-2 w-full resize-none border-b border-ink/30 bg-transparent pb-2 font-serif text-[1.25rem] leading-snug font-light outline-none placeholder:text-ink/25 focus:border-ink"
        />
        <FieldError id="e-details" message={errors.details} />
      </div>

      <div className="grid grid-cols-6 gap-4">
        {[
          { name: "city", label: t.city, span: "col-span-3", placeholder: "Kathmandu", type: "text" },
          { name: "date", label: t.date, span: "col-span-3", placeholder: t.datePlaceholder, type: "text" },
          { name: "people", label: t.people, span: "col-span-2", placeholder: "2", type: "number" },
        ].map((f) => (
          <div key={f.name} className={f.span}>
            <label htmlFor={`c-${f.name}`} className="text-[0.6875rem] font-semibold tracking-[0.2em] text-mute uppercase">
              {f.label} <span className="font-normal normal-case tracking-normal">({t.optional})</span>
            </label>
            <input
              id={`c-${f.name}`}
              name={f.name}
              type={f.type}
              inputMode={f.type === "number" ? "numeric" : undefined}
              min={f.type === "number" ? 1 : undefined}
              max={f.type === "number" ? 50 : undefined}
              maxLength={80}
              placeholder={f.placeholder}
              aria-invalid={!!errors[f.name] || undefined}
              className="mt-2 w-full border-b border-ink/30 bg-transparent pb-2 text-base outline-none placeholder:text-ink/30 focus:border-ink"
            />
            <FieldError id={`e-${f.name}`} message={errors[f.name]} />
          </div>
        ))}
      </div>

      <div>
        <PendingButton pending={pending} pendingLabel={t.submitting} className="btn w-full">
          {t.submit}
        </PendingButton>
        <FormMessage state={state} />
        <p className="mt-3 text-sm text-mute">{t.note}</p>
      </div>
    </form>
  );
}
