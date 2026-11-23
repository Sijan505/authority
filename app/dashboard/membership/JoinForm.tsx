"use client";

import { useState } from "react";
import { submitPayment } from "@/app/actions/member";
import { Chips, FieldError, FormMessage, PendingButton, useKeepValuesAction } from "@/components/forms";
import { cycleLabels, formatNPR, paymentMethods, proPriceOf, type CycleId, type MethodId } from "@/config/pricing";
import { copy } from "@/content/copy";

const t = copy.join;

/** Membership payment form. There is one plan, so there is no package choice. */
export function JoinForm() {
  const [state, onSubmit, pending] = useKeepValuesAction(submitPayment);
  const [cycle, setCycle] = useState<CycleId>("YEARLY");
  const [method, setMethod] = useState<MethodId>("ESEWA");

  if (state.ok) {
    return (
      <p role="status" className="card border-2 text-lg" style={{ borderColor: "var(--accent)" }}>
        {state.message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <Chips
        name="cycle"
        legend={t.chooseCycle}
        required
        defaultValue={cycle}
        options={(Object.keys(cycleLabels) as CycleId[]).map((id) => ({ value: id, label: cycleLabels[id] }))}
        onChange={(v) => setCycle(v as CycleId)}
        error={state.errors?.cycle}
      />

      <p className="text-xl">
        {t.amount}: <strong className="text-2xl text-brown">{formatNPR(proPriceOf(cycle))}</strong>
      </p>

      <Chips
        name="method"
        legend={t.chooseMethod}
        required
        defaultValue={method}
        options={(Object.keys(paymentMethods) as MethodId[]).map((id) => ({ value: id, label: paymentMethods[id].name }))}
        onChange={(v) => setMethod(v as MethodId)}
        error={state.errors?.method}
      />

      <div className="card">
        <h2 className="text-xl font-semibold text-brown">
          {t.instructions}: {paymentMethods[method].name}
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {paymentMethods[method].instructions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>

      <div>
        <label htmlFor="f-reference" className="label">
          {t.reference}
        </label>
        <p id="h-reference" className="hint">
          {t.referenceHint}
        </p>
        <input
          id="f-reference"
          name="reference"
          maxLength={120}
          className="input"
          aria-invalid={!!state.errors?.reference || undefined}
          aria-describedby={`h-reference${state.errors?.reference ? " e-reference" : ""}`}
        />
        <FieldError id="e-reference" message={state.errors?.reference} />
      </div>

      <div>
        <label htmlFor="f-screenshot" className="label">
          {t.screenshot}
        </label>
        <p id="h-screenshot" className="hint">
          {t.screenshotHint}
        </p>
        <input
          id="f-screenshot"
          name="screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="input"
          aria-invalid={!!state.errors?.screenshot || undefined}
          aria-describedby={`h-screenshot${state.errors?.screenshot ? " e-screenshot" : ""}`}
        />
        <FieldError id="e-screenshot" message={state.errors?.screenshot} />
      </div>

      <FormMessage state={state} />
      <PendingButton pending={pending} pendingLabel={t.submitting} className="btn btn-accent w-full sm:w-auto">
        {t.submit}
      </PendingButton>
    </form>
  );
}
