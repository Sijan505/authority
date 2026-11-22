"use client";

// "Request an invitation": a full-screen questionnaire that asks one question at a
// time. It is mounted once in the root layout and opened by <InquiryButton>, by the
// <InquiryPrompt> card that slides in after the home-page intro, or by a #inquire link.
import { useEffect, useRef, useState, useTransition } from "react";
import { submitInquiry } from "@/app/actions/inquiry";
import { LOGO_PATH } from "@/components/Decor";
import { inquiryCities, inquiryInterests, inquiryRoles, inquiryWorlds, site } from "@/config/site";
import { copy } from "@/content/copy";
import { INQUIRY_LIMITS, parseContact } from "@/lib/validation";

const OPEN_EVENT = "authority:inquire";
const SENT_KEY = "authority-inquired"; // localStorage: this browser already sent one
const DISMISS_KEY = "authority-inquiry-dismissed"; // sessionStorage: card closed this visit

const t = copy.inquiry;
const q = t.questions;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const openInquiry = () => window.dispatchEvent(new Event(OPEN_EVENT));

function store(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

type Answers = {
  name: string;
  email: string;
  whatsapp: string;
  world: string;
  role: string;
  city: string;
  building: string;
  link: string;
  interests: string[];
  bring: string;
  referred: "" | "yes" | "no";
  referrer: string;
  notes: string;
};
type Key = keyof Answers;

const EMPTY: Answers = {
  name: "",
  email: "",
  whatsapp: "",
  world: "",
  role: "",
  city: "",
  building: "",
  link: "",
  interests: [],
  bring: "",
  referred: "",
  referrer: "",
  notes: "",
};

type Step =
  | { kind: "intro" }
  | { kind: "text"; key: Key; title: string; hint?: string; placeholder?: string; type?: "text" | "email" | "tel" | "url"; optional?: boolean; check?: (v: string) => string | null }
  | { kind: "long"; key: Key; title: string; hint?: string; placeholder?: string; optional?: boolean }
  | { kind: "choice"; key: Key; title: string; options: readonly string[] }
  | { kind: "multi"; key: Key; title: string; options: readonly string[] }
  | { kind: "yesno"; key: Key; title: string };

function buildSteps(a: Answers): Step[] {
  return [
    { kind: "intro" },
    { kind: "text", key: "name", ...q.name },
    { kind: "text", key: "email", type: "email", ...q.email, check: (v) => (EMAIL_RE.test(v.trim()) ? null : q.email.invalid) },
    {
      kind: "text",
      key: "whatsapp",
      type: "tel",
      optional: true,
      ...q.whatsapp,
      check: (v) => (v.trim() === "" || parseContact(v)?.type === "whatsapp" ? null : q.whatsapp.invalid),
    },
    { kind: "choice", key: "world", title: q.world.title, options: inquiryWorlds },
    { kind: "choice", key: "role", title: q.role.title, options: inquiryRoles },
    { kind: "choice", key: "city", title: q.city.title, options: inquiryCities },
    { kind: "long", key: "building", ...q.building },
    { kind: "text", key: "link", type: "url", optional: true, ...q.link },
    { kind: "multi", key: "interests", title: q.interests.title, options: inquiryInterests },
    { kind: "long", key: "bring", ...q.bring },
    { kind: "yesno", key: "referred", title: q.referred.title },
    ...(a.referred === "yes" ? [{ kind: "text", key: "referrer", ...q.referrer } as Step] : []),
    { kind: "long", key: "notes", optional: true, ...q.notes },
  ];
}

const LETTERS = "ABCDEFGHIJ";

/** Opens the questionnaire. Without JS it falls back to the contact page. */
export function InquiryButton({ className = "btn", children = t.cta }: { className?: string; children?: React.ReactNode }) {
  return (
    <a
      href="/contact"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        openInquiry();
      }}
    >
      {children}
    </a>
  );
}

/** Card that slides in once the home-page intro has lifted, inviting an inquiry. */
export function InquiryPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (store("local")?.getItem(SENT_KEY) || store("session")?.getItem(DISMISS_KEY)) return;
    const intro = document.getElementById("intro");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introPlaying = intro && !intro.hidden && !reduced;
    const timer = window.setTimeout(() => setShow(true), introPlaying ? 4400 : 1600);
    const hide = () => setShow(false);
    window.addEventListener(OPEN_EVENT, hide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(OPEN_EVENT, hide);
    };
  }, []);

  if (!show) return null;
  const dismiss = () => {
    store("session")?.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <aside aria-label={t.prompt.heading} className="inq-prompt fixed inset-x-4 bottom-4 z-40 bg-ink p-6 text-ivory shadow-2xl sm:right-6 sm:bottom-6 sm:left-auto sm:w-[360px]">
      <button type="button" onClick={dismiss} aria-label={t.prompt.dismiss} className="absolute top-3 right-4 text-xl leading-none opacity-60 hover:opacity-100">
        ×
      </button>
      <p className="pr-6 font-serif text-[1.625rem] leading-tight font-light">{t.prompt.heading}</p>
      <p className="mt-2 text-[0.9375rem] opacity-80">{t.prompt.body}</p>
      <div className="mt-5 flex items-center gap-4">
        <button type="button" onClick={openInquiry} className="btn btn-light">
          {t.prompt.cta} →
        </button>
        <button type="button" onClick={dismiss} className="text-sm opacity-70 hover:opacity-100">
          {t.prompt.dismiss}
        </button>
      </div>
    </aside>
  );
}

/** The confirmation shown after an inquiry is sent. */
function Received({ name, email, reference, titleId, onClose }: { name: string; email: string; reference?: string; titleId: string; onClose: () => void }) {
  const d = t.done;
  const first = name.trim().split(/\s+/)[0] ?? "";
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 48 48" className="inq-star h-9 w-9 text-tika" fill="none" aria-hidden="true">
            <path d={LOGO_PATH} pathLength={1} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <span className="text-xs tracking-[0.32em] text-mute uppercase">{d.eyebrow}</span>
        </div>
        {reference && (
          <p className="text-xs tracking-[0.25em] text-mute uppercase">
            {d.refLabel} <span className="ml-2 font-sans text-sm font-semibold tracking-[0.12em] text-ink tabular-nums">{reference}</span>
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <div>
          <h2 id={titleId} className="text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[1.02] font-light">
            {d.heading(first)}
          </h2>
          <p className="mt-6 max-w-[44ch] text-lg">{d.body}</p>
          {email && (
            <p className="mt-6 text-[0.9375rem] text-mute">
              {d.replyTo} <span className="text-ink">{email}</span>.
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="/platform" onClick={onClose} className="btn">
              {d.explore}
            </a>
            <button type="button" onClick={onClose} className="btn btn-alt">
              {d.close}
            </button>
          </div>
        </div>

        <div>
          <p className="mb-5 text-xs tracking-[0.32em] text-mute uppercase">{d.nextHeading}</p>
          <ol className="border-t border-ink">
            {d.next.map((s, i) => (
              <li key={s.title} className="inq-next grid grid-cols-[2.5rem_1fr] border-b border-line py-5" style={{ animationDelay: `${300 + i * 120}ms` }}>
                <span className="font-serif text-lg text-tika tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <b className="block font-serif text-[1.375rem] font-normal">{s.title}</b>
                  <span className="text-[0.9375rem] text-mute">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[0.9375rem] text-mute">
            {reference && <>{d.keepRef} </>}
            {d.questions}{" "}
            <a href={`mailto:${site.contactEmail}`} className="link">
              {site.contactEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/** The full-screen questionnaire. Mount once, in the root layout. */
export function InquiryForm() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [reference, setReference] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const opener = useRef<HTMLElement | null>(null); // gets focus back on close

  const steps = buildSteps(answers);
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index === steps.length - 1;
  const questionCount = steps.length - 1; // the intro screen isn't a question

  const close = () => {
    window.clearTimeout(advanceTimer.current);
    setOpen(false);
    setError(null);
    // After a successful send, the next opening starts a fresh inquiry.
    if (done) {
      setDone(false);
      setAnswers(EMPTY);
      setIndex(0);
      setReference(undefined);
    }
    opener.current?.focus?.();
  };

  // Open from the custom event or a #inquire link.
  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
      setError(null);
    };
    const fromHash = () => {
      if (window.location.hash === "#inquire") {
        history.replaceState(null, "", window.location.pathname + window.location.search);
        show();
      }
    };
    fromHash();
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("hashchange", fromHash);
    };
  }, []);

  // Lock page scroll while open, and put focus inside the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus the field (or the dialog) whenever the question changes.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => (fieldRef.current ?? dialogRef.current)?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open, index, done]);

  const set = <K extends Key>(key: K, value: Answers[K]) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setError(null);
  };

  const validate = (s: Step): string | null => {
    if (s.kind === "intro") return null;
    const v = answers[s.key];
    if (s.kind === "multi") return (v as string[]).length ? null : t.required;
    const str = String(v);
    if ("optional" in s && s.optional && str.trim() === "") return null;
    if (str.trim() === "") return t.required;
    if (s.kind === "text" && s.check) return s.check(str);
    return null;
  };

  const submit = () => {
    const fd = new FormData();
    (Object.keys(answers) as Key[]).forEach((k) => {
      if (k === "interests") answers.interests.forEach((i) => fd.append("interests", i));
      else if (k === "referrer") fd.set(k, answers.referred === "yes" ? answers.referrer : "");
      else if (k !== "referred") fd.set(k, String(answers[k]));
    });
    fd.set("company", ""); // honeypot, always empty for people
    startTransition(async () => {
      const res = await submitInquiry({}, fd);
      if (res.ok) {
        setReference(res.ref);
        setDone(true);
        store("local")?.setItem(SENT_KEY, "1");
        return;
      }
      // Jump back to the first question the server rejected.
      const bad = res.errors ? steps.findIndex((s) => s.kind !== "intro" && res.errors![s.key]) : -1;
      if (bad > 0) {
        setIndex(bad);
        setError(res.errors![(steps[bad] as Exclude<Step, { kind: "intro" }>).key]);
      } else setError(res.message ?? copy.errors.generic);
    });
  };

  const next = () => {
    // A pending auto-advance (from picking a choice) must not move on a second time.
    window.clearTimeout(advanceTimer.current);
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (isLast) submit();
    else setIndex(index + 1);
  };

  const back = () => {
    window.clearTimeout(advanceTimer.current);
    setError(null);
    setIndex(Math.max(0, index - 1));
  };

  // Picking a single choice moves on by itself after a beat, as in a conversation.
  // The target is fixed now, so a quick Enter or a double click can't skip a question.
  const choose = (key: Key, value: string) => {
    set(key, value as never);
    window.clearTimeout(advanceTimer.current);
    const target = index + 1;
    advanceTimer.current = window.setTimeout(() => setIndex(target), 380);
  };

  // Keep Tab inside the dialog while it is open.
  const trapTab = (e: React.KeyboardEvent) => {
    const root = dialogRef.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, textarea")];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (e.key === "Tab") return trapTab(e);
    if (done || pending) return;
    const target = e.target as HTMLElement;
    // Enter moves on from a text field or the dialog itself; on a button it just presses that button.
    if (e.key === "Enter" && (target.tagName === "INPUT" || target === dialogRef.current || (target.tagName === "TEXTAREA" && !e.shiftKey))) {
      e.preventDefault();
      return next();
    }
    // Letter shortcuts for choices: A, B, C…
    if ((step.kind === "choice" || step.kind === "multi" || step.kind === "yesno") && !e.metaKey && !e.ctrlKey && e.key.length === 1) {
      const options = step.kind === "yesno" ? [t.yes, t.no] : step.options;
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (i < 0 || i >= options.length) return;
      e.preventDefault();
      if (step.kind === "multi") {
        const cur = answers.interests;
        const o = options[i];
        set("interests", cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
      } else if (step.kind === "yesno") choose("referred", i === 0 ? "yes" : "no");
      else choose(step.key, options[i]);
    }
  };

  if (!open) return null;

  const progress = done ? 1 : index / questionCount;
  const titleId = "inquiry-title";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="inq-overlay fixed inset-0 z-[70] flex flex-col bg-ivory text-ink outline-none"
    >
      {/* Progress */}
      <div className="h-px w-full bg-line">
        <div className="inq-bar h-px origin-left" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="flex items-center justify-between px-6 py-5 md:px-10">
        <span className="font-serif text-lg tracking-[0.3em]">{copy.brand.wordmark}</span>
        <div className="flex items-center gap-6">
          {!done && index > 0 && (
            <span className="text-xs tracking-[0.25em] text-mute tabular-nums">
              {String(index).padStart(2, "0")} / {String(questionCount).padStart(2, "0")}
            </span>
          )}
          <button type="button" onClick={close} className="text-sm text-mute hover:text-ink">
            {t.close} ✕
          </button>
        </div>
      </div>

      {/* my-auto (not items-center) centres short screens but lets tall ones scroll from the top on phones. */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-16 md:px-10">
        <div key={done ? "done" : index} className={`inq-step mx-auto my-auto w-full ${done ? "max-w-[960px]" : "max-w-[720px]"}`}>
          {done ? (
            <Received name={answers.name} email={answers.email} reference={reference} titleId={titleId} onClose={close} />
          ) : step.kind === "intro" ? (
            <div>
              <h2 id={titleId} className="text-[clamp(2.5rem,7vw,5rem)] leading-[1.02] font-light">
                {t.intro.heading}
              </h2>
              <p className="mt-6 max-w-[48ch] text-lg text-mute">{t.intro.body}</p>
              <div className="mt-10 flex items-center gap-4">
                <button type="button" onClick={next} className="btn">
                  {t.intro.start}
                </button>
                <span className="text-xs text-mute">{t.pressEnter}</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-xs tracking-[0.25em] text-tika">
                {String(index).padStart(2, "0")} →
              </p>
              <h2 id={titleId} className="text-[clamp(1.875rem,4.5vw,3rem)] leading-[1.1] font-light">
                {step.title}
              </h2>
              {"hint" in step && step.hint && <p className="mt-3 max-w-[56ch] text-mute">{step.hint}</p>}
              {step.kind === "multi" && <p className="mt-3 text-mute">{t.chooseMany}</p>}

              <div className="mt-8">
                {step.kind === "text" && (
                  <input
                    ref={fieldRef}
                    type={step.type ?? "text"}
                    inputMode={step.type === "tel" ? "tel" : step.type === "email" ? "email" : undefined}
                    autoComplete={step.key === "name" ? "name" : step.key === "email" ? "email" : step.key === "whatsapp" ? "tel" : "off"}
                    value={String(answers[step.key])}
                    onChange={(e) => set(step.key, e.target.value as never)}
                    placeholder={step.placeholder}
                    maxLength={INQUIRY_LIMITS[step.key as keyof typeof INQUIRY_LIMITS] ?? INQUIRY_LIMITS.name}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "inquiry-error" : undefined}
                    className="w-full border-b border-ink/30 bg-transparent pb-3 font-serif text-[clamp(1.5rem,3.5vw,2.25rem)] font-light outline-none placeholder:text-ink/25 focus:border-ink"
                  />
                )}
                {step.kind === "long" && (
                  <textarea
                    ref={fieldRef}
                    rows={3}
                    value={String(answers[step.key])}
                    onChange={(e) => set(step.key, e.target.value as never)}
                    placeholder={step.placeholder}
                    maxLength={INQUIRY_LIMITS.long}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "inquiry-error" : undefined}
                    className="w-full resize-none border-b border-ink/30 bg-transparent pb-3 font-serif text-[clamp(1.25rem,2.8vw,1.75rem)] leading-snug font-light outline-none placeholder:text-ink/25 focus:border-ink"
                  />
                )}
                {(step.kind === "choice" || step.kind === "multi" || step.kind === "yesno") && (
                  <div role={step.kind === "multi" ? "group" : "radiogroup"} aria-labelledby={titleId} className="grid max-w-[520px] gap-2.5">
                    {(step.kind === "yesno" ? [t.yes, t.no] : step.options).map((o, i) => {
                      const value = step.kind === "yesno" ? (i === 0 ? "yes" : "no") : o;
                      const selected = step.kind === "multi" ? answers.interests.includes(o) : answers[step.key] === value;
                      return (
                        <button
                          key={o}
                          type="button"
                          role={step.kind === "multi" ? "checkbox" : "radio"}
                          aria-checked={selected}
                          onClick={() => {
                            if (step.kind === "multi") set("interests", selected ? answers.interests.filter((x) => x !== o) : [...answers.interests, o]);
                            else choose(step.key, value);
                          }}
                          className={`inq-option flex items-center gap-4 border px-4 py-3 text-left transition-colors ${
                            selected ? "border-ink bg-ink text-ivory" : "border-ink/25 hover:border-ink"
                          }`}
                        >
                          <span className={`grid h-6 w-6 shrink-0 place-items-center border text-xs ${selected ? "border-ivory/60" : "border-ink/30"}`}>{LETTERS[i]}</span>
                          <span className="flex-1">{o}</span>
                          {selected && <span aria-hidden="true">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p id="inquiry-error" role="alert" className="mt-4 min-h-6 text-[0.9375rem] text-error">
                {error}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button type="button" onClick={next} disabled={pending} className="btn">
                  {pending ? t.submitting : isLast ? t.submit : t.next}
                </button>
                {!pending && <span className="hidden text-xs text-mute sm:inline">{t.pressEnter}</span>}
                <button type="button" onClick={back} className="ml-auto text-sm text-mute hover:text-ink">
                  ← {t.back}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
