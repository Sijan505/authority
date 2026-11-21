"use client";

import { useRef, useState } from "react";
import { completeOnboarding } from "@/app/actions/member";
import { Chips, FieldError, FieldPicker, FormMessage, PendingButton, Req, useKeepValuesAction } from "@/components/forms";
import { cities, depositOptions, helpOptions, perks } from "@/config/site";
import { copy } from "@/content/copy";

const t = copy.onboarding;
const opts = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

// Which step each answer lives on, so server errors can jump back to it.
const STEP_OF: Record<string, number> = { field: 0, name: 1, city: 1, contact: 1, perks: 2, deposit: 3, helpBuild: 4, contribution: 4 };
const REQUIRED: string[][] = [["field"], ["name", "city", "contact"], [], ["deposit"], ["helpBuild"]];

export function OnboardingForm({
  fields,
  defaults,
}: {
  fields: { value: string; label: string; description: string; accent: string; tint: string }[];
  defaults: { name: string; contact: string };
}) {
  const [state, onSubmit, pending] = useKeepValuesAction(completeOnboarding);
  const [step, setStep] = useState(0);
  const [helpBuild, setHelpBuild] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const errors = { ...state.errors, ...localErrors };

  // When the server returns errors, jump to the step of the first one.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    const first = Object.keys(state.errors ?? {})[0];
    if (first && first in STEP_OF) setStep(STEP_OF[first]);
  }

  const go = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = () => {
    const data = new FormData(formRef.current!);
    const missing: Record<string, string> = {};
    for (const key of REQUIRED[step]) {
      if (!String(data.get(key) ?? "").trim()) missing[key] = "This answer is required.";
    }
    setLocalErrors(missing);
    if (Object.keys(missing).length === 0) go(step + 1);
    else document.getElementById(`f-${Object.keys(missing)[0]}`)?.focus();
  };

  const clear = (key: string) =>
    setLocalErrors((prev) => {
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
  const showContribution = helpBuild === helpOptions[0] || helpBuild === helpOptions[1];
  const last = t.steps.length - 1;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        // Enter on an earlier step moves forward instead of submitting.
        if (step < last) {
          e.preventDefault();
          next();
        } else onSubmit(e);
      }}
    >
      <p className="text-sm uppercase tracking-[0.2em] text-gold-dark">
        Step {step + 1} of {t.steps.length}
      </p>
      <h2 ref={headingRef} tabIndex={-1} className="mt-1 text-3xl font-medium text-brown outline-none">
        {t.steps[step]}
      </h2>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {t.steps.map((s, i) => (
          <span key={s} className={`h-1 flex-1 rounded ${i <= step ? "bg-gold-dark" : "bg-gold/20"}`} />
        ))}
      </div>

      {/* All steps stay mounted so every answer is submitted together. */}
      <div className="mt-8">
        <div hidden={step !== 0}>
          <FieldPicker
            name="field"
            legend={t.field}
            hint={t.fieldHint}
            options={fields}
            error={errors.field}
            onChange={() => clear("field")}
          />
        </div>

        <div hidden={step !== 1} className="space-y-8">
          <div>
            <label htmlFor="f-name" className="label">
              {t.name} <Req />
            </label>
            <input
              id="f-name"
              name="name"
              autoComplete="name"
              defaultValue={defaults.name}
              maxLength={120}
              required
              aria-invalid={!!errors.name || undefined}
              aria-describedby={errors.name ? "e-name" : undefined}
              onChange={() => clear("name")}
              className="input"
            />
            <FieldError id="e-name" message={errors.name} />
          </div>
          <Chips name="city" legend={t.city} options={opts(cities)} required error={errors.city} onChange={() => clear("city")} />
          <div>
            <label htmlFor="f-contact" className="label">
              {t.contact} <Req />
            </label>
            <p id="h-contact" className="hint">
              {t.contactHint}
            </p>
            <input
              id="f-contact"
              name="contact"
              defaultValue={defaults.contact}
              maxLength={200}
              required
              aria-invalid={!!errors.contact || undefined}
              aria-describedby={`h-contact${errors.contact ? " e-contact" : ""}`}
              onChange={() => clear("contact")}
              className="input"
            />
            <FieldError id="e-contact" message={errors.contact} />
          </div>
        </div>

        <div hidden={step !== 2}>
          <Chips name="perks" type="checkbox" legend={t.perks} hint={t.perksHint} options={opts(perks)} error={errors.perks} />
        </div>

        <div hidden={step !== 3}>
          <Chips
            name="deposit"
            legend={t.deposit}
            hint={t.depositHint}
            options={opts(depositOptions)}
            required
            error={errors.deposit}
            onChange={() => clear("deposit")}
          />
        </div>

        <div hidden={step !== 4} className="space-y-8">
          <Chips
            name="helpBuild"
            legend={t.helpBuild}
            options={opts(helpOptions)}
            required
            stacked
            error={errors.helpBuild}
            onChange={(v) => {
              setHelpBuild(v);
              clear("helpBuild");
            }}
          />
          {showContribution && (
            <div>
              <label htmlFor="f-contribution" className="label">
                {t.contribution} <span className="hint inline font-normal">({t.optional})</span>
              </label>
              <p id="h-contribution" className="hint">
                {t.contributionHint}
              </p>
              <textarea
                id="f-contribution"
                name="contribution"
                rows={3}
                maxLength={1000}
                aria-describedby="h-contribution"
                className="input"
              />
              <FieldError id="e-contribution" message={errors.contribution} />
            </div>
          )}
        </div>
      </div>

      <FormMessage state={state} />

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-gold/30 pt-6">
        {step > 0 ? (
          <button type="button" className="btn-ghost" onClick={() => go(step - 1)}>
            {t.back}
          </button>
        ) : (
          <span />
        )}
        {step < last ? (
          <button type="button" className="btn" onClick={next}>
            {t.next}
          </button>
        ) : (
          <PendingButton pending={pending} pendingLabel={t.submitting}>
            {t.submit}
          </PendingButton>
        )}
      </div>
    </form>
  );
}
