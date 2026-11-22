"use client";

// "Register your interest": a full-screen form that asks one question at a time, as
// set out in the landing-page workplan (field, name, city, email or WhatsApp, perks,
// price band, deposit, help build). It is mounted once in the root layout and opened by
// <InquiryButton>, by the <InquiryPrompt> card that slides in after the home-page
// intro, or by a #inquire link.
import { useEffect, useRef, useState, useTransition } from "react";
import { submitInquiry } from "@/app/actions/inquiry";
import { LOGO_PATH } from "@/components/Decor";
import { cities, contributionOptions, depositOptions, helpOptions, inquiryFields, perks, priceBands, site } from "@/config/site";
import { copy } from "@/content/copy";
import { INQUIRY_LIMITS, parseContact } from "@/lib/validation";

const OPEN_EVENT = "authority:inquire";
const SENT_KEY = "authority-inquired"; // localStorage: this browser already sent one
const DISMISS_KEY = "authority-inquiry-dismissed"; // sessionStorage: card closed this visit
const SOURCE_KEY = "authority-source"; // sessionStorage: where this visit came from

const t = copy.inquiry;
const q = t.questions;

export const openInquiry = () => window.dispatchEvent(new Event(OPEN_EVENT));

function store(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Works out where this visit came from, once per visit, from ?utm_source=, ?ref= or
 * ?source= on the landing URL, or else the referring site. Values match
 * inquirySources in config/site.ts; the server falls back to "Direct" for anything else.
 */
function captureSource() {
  const s = store("session");
  if (!s || s.getItem(SOURCE_KEY)) return;
  const params = new URLSearchParams(window.location.search);
  const tag = (params.get("utm_source") ?? params.get("source") ?? "").trim().toLowerCase();
  const ref = (params.get("ref") ?? "").trim();
  let host = "";
  try {
    const r = document.referrer ? new URL(document.referrer).hostname : "";
    host = r && r !== window.location.hostname ? r.replace(/^www\./, "") : "";
  } catch {}
  const probe = `${tag} ${host}`;
  const source = /\b(ig|instagram)/.test(probe)
    ? "Instagram"
    : /tiktok/.test(probe)
      ? "TikTok"
      : /\b(fb|facebook)/.test(probe)
        ? "Facebook"
        : ref || /refer|friend|member/.test(tag)
          ? "Referral"
          : /google|bing|duckduckgo|yahoo/.test(host)
            ? "Search"
            : tag || host
              ? "Other"
              : "Direct";
  const detail = [tag && `utm:${tag}`, ref && `ref:${ref}`, host && `from:${host}`].filter(Boolean).join(" ").slice(0, 200);
  s.setItem(SOURCE_KEY, JSON.stringify({ source, detail }));
}

function readSource(): { source: string; detail: string } {
  try {
    return JSON.parse(store("session")?.getItem(SOURCE_KEY) ?? "") ?? { source: "Direct", detail: "" };
  } catch {
    return { source: "Direct", detail: "" };
  }
}

type Answers = {
  field: string;
  name: string;
  city: string;
  contact: string;
  perks: string[];
  priceBand: string;
  deposit: string;
  helpBuild: string;
  contribution: string[];
};
type Key = keyof Answers;
type ListKey = "perks" | "contribution";
type TextKey = Exclude<Key, ListKey>;

const EMPTY: Answers = { field: "", name: "", city: "", contact: "", perks: [], priceBand: "", deposit: "", helpBuild: "", contribution: [] };

type Step =
  | { kind: "intro" }
  | { kind: "text"; key: TextKey; title: string; hint?: string; placeholder?: string; type?: "text" | "email"; check?: (v: string) => string | null }
  | { kind: "choice"; key: TextKey; title: string; hint?: string; options: readonly string[] }
  | { kind: "multi"; key: ListKey; title: string; hint?: string; options: readonly string[]; optional?: boolean };
type Question = Exclude<Step, { kind: "intro" }>;

/** The contribution follow-up only appears for people who might help build it. */
const wantsToHelp = (a: Answers) => a.helpBuild !== "" && a.helpBuild !== helpOptions[2];

function buildSteps(a: Answers): Step[] {
  return [
    { kind: "intro" },
    { kind: "choice", key: "field", title: q.field.title, options: inquiryFields },
    { kind: "text", key: "name", ...q.name },
    { kind: "choice", key: "city", title: q.city.title, options: cities },
    {
      kind: "text",
      key: "contact",
      type: "email", // the right keyboard on phones for either answer
      ...q.contact,
      check: (v) => (parseContact(v) ? null : q.contact.invalid),
    },
    { kind: "multi", key: "perks", title: q.perks.title, options: perks },
    { kind: "choice", key: "priceBand", ...q.priceBand, options: priceBands },
    { kind: "choice", key: "deposit", ...q.deposit, options: depositOptions },
    { kind: "choice", key: "helpBuild", title: q.helpBuild.title, options: helpOptions },
    ...(wantsToHelp(a) ? [{ kind: "multi", key: "contribution", title: q.contribution.title, hint: t.optional, options: contributionOptions, optional: true } as Step] : []),
  ];
}

/** The eight numbered questions; the contribution follow-up shares number 08. */
const QUESTION_COUNT = 8;

const LETTERS = "ABCDEFGHIJ";

/** Opens the form. Without JS it falls back to the contact page. */
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

/** Card that slides in once the home-page intro has lifted, inviting a sign-up. */
export function InquiryPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (store("local")?.getItem(SENT_KEY) || store("session")?.getItem(DISMISS_KEY)) return;
    const intro = document.getElementById("intro");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introPlaying = intro && !intro.hidden && !reduced;
    const timer = window.setTimeout(() => setShow(true), introPlaying ? 3400 : 1600);
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

/** The confirmation shown after a sign-up is sent. */
function Received({
  answers,
  reference,
  repeat,
  titleId,
  onClose,
}: {
  answers: Answers;
  reference?: string;
  repeat?: boolean;
  titleId: string;
  onClose: () => void;
}) {
  const d = t.done;
  const first = answers.name.trim().split(/\s+/)[0] ?? "";
  const contact = parseContact(answers.contact);
  const mightDeposit = answers.deposit === depositOptions[0] || answers.deposit === depositOptions[1];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 48 48" className="inq-star h-9 w-9 text-tika" fill="none" aria-hidden="true">
            <path d={LOGO_PATH} pathLength={1} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <span className="text-xs tracking-[0.32em] text-mute uppercase">{repeat ? d.repeatEyebrow : d.eyebrow}</span>
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
          <p className="mt-6 max-w-[44ch] text-lg">{repeat ? d.repeatBody : d.body}</p>
          {contact && (
            <p className="mt-6 text-[0.9375rem] text-mute">
              {contact.type === "email" ? d.replyEmail : d.replyWhatsApp} <span className="text-ink">{contact.normalized}</span>.
            </p>
          )}
          {mightDeposit && !repeat && <p className="mt-4 max-w-[48ch] border-l-2 border-gold pl-4 text-[0.9375rem] text-mute">{d.deposit}</p>}
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
                <span className={`font-serif text-lg tabular-nums ${i === 0 ? "text-tika" : "text-mute"}`}>{i === 0 ? "✓" : String(i + 1).padStart(2, "0")}</span>
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
          <p className="mt-3 text-[0.9375rem] text-mute">
            {d.follow}{" "}
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="link">
              {site.instagramHandle}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/** The full-screen form. Mount once, in the root layout. */
export function InquiryForm() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [reference, setReference] = useState<string | undefined>();
  const [repeat, setRepeat] = useState(false);
  const [pending, startTransition] = useTransition();
  const fieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const opener = useRef<HTMLElement | null>(null); // gets focus back on close

  const steps = buildSteps(answers);
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  // Remember where this visit came from, so the sign-up can record it.
  useEffect(captureSource, []);

  const close = () => {
    window.clearTimeout(advanceTimer.current);
    setOpen(false);
    setError(null);
    // After a successful send, the next opening starts afresh.
    if (done) {
      setDone(false);
      setAnswers(EMPTY);
      setIndex(0);
      setReference(undefined);
      setRepeat(false);
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

  // Lock page scroll while open.
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

  const toggle = (key: ListKey, option: string) => {
    const cur = answers[key];
    set(key, cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option]);
  };

  const validate = (s: Step): string | null => {
    if (s.kind === "intro") return null;
    if (s.kind === "multi") return s.optional || answers[s.key].length ? null : t.required;
    const v = answers[s.key].trim();
    if (v === "") return t.required;
    if (s.kind === "text" && s.check) return s.check(v);
    return null;
  };

  const submit = () => {
    const fd = new FormData();
    (["field", "name", "city", "contact", "priceBand", "deposit", "helpBuild"] as const).forEach((k) => fd.set(k, answers[k]));
    answers.perks.forEach((p) => fd.append("perks", p));
    if (wantsToHelp(answers)) answers.contribution.forEach((c) => fd.append("contribution", c));
    const src = readSource();
    fd.set("source", src.source);
    fd.set("sourceDetail", src.detail);
    fd.set("company", ""); // honeypot, always empty for people
    startTransition(async () => {
      const res = await submitInquiry({}, fd);
      if (res.ok) {
        setReference(res.ref);
        setRepeat(Boolean(res.repeat));
        setDone(true);
        store("local")?.setItem(SENT_KEY, "1");
        return;
      }
      // Jump back to the first question the server rejected.
      const bad = res.errors ? steps.findIndex((s) => s.kind !== "intro" && res.errors![s.key]) : -1;
      if (bad > 0) {
        setIndex(bad);
        setError(res.errors![(steps[bad] as Question).key]);
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
  // On the final question it waits for "Register" instead.
  const choose = (key: TextKey, value: string) => {
    set(key, value);
    window.clearTimeout(advanceTimer.current);
    const target = index + 1;
    if (target >= buildSteps({ ...answers, [key]: value }).length) return;
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
    if (e.key === "Enter" && (target.tagName === "INPUT" || target === dialogRef.current)) {
      e.preventDefault();
      return next();
    }
    // Letter shortcuts for choices: A, B, C…
    if ((step.kind === "choice" || step.kind === "multi") && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1) {
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (i < 0 || i >= step.options.length) return;
      e.preventDefault();
      if (step.kind === "multi") toggle(step.key, step.options[i]);
      else choose(step.key, step.options[i]);
    }
  };

  if (!open) return null;

  const progress = done ? 1 : index / (steps.length - 1);
  const number = Math.min(index, QUESTION_COUNT);
  const titleId = "inquiry-title";
  const pad = (n: number) => String(n).padStart(2, "0");

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
        <span className="wordmark-gradient font-serif text-lg tracking-[0.3em]">{copy.brand.wordmark}</span>
        <div className="flex items-center gap-6">
          {!done && index > 0 && (
            <span className="text-xs tracking-[0.25em] text-mute tabular-nums">
              {pad(number)} / {pad(QUESTION_COUNT)}
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
            <Received answers={answers} reference={reference} repeat={repeat} titleId={titleId} onClose={close} />
          ) : step.kind === "intro" ? (
            <div>
              <p className="mb-6 text-xs tracking-[0.32em] text-tika uppercase">{t.intro.eyebrow}</p>
              <h2 id={titleId} className="text-[clamp(2.5rem,7vw,5rem)] leading-[1.02] font-light">
                {t.intro.heading}
              </h2>
              <p className="mt-6 max-w-[48ch] text-lg text-mute">{t.intro.body}</p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button type="button" onClick={next} className="btn">
                  {t.intro.start}
                </button>
                <span className="text-xs tracking-[0.2em] text-mute uppercase">{t.intro.time}</span>
                <span className="hidden text-xs text-mute sm:inline">{t.pressEnter}</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-xs tracking-[0.25em] text-tika">{pad(number)} →</p>
              <h2 id={titleId} className="text-[clamp(1.875rem,4.5vw,3rem)] leading-[1.1] font-light">
                {step.title}
              </h2>
              {step.hint && <p className="mt-3 max-w-[56ch] text-mute">{step.hint}</p>}
              {step.kind === "multi" && !step.optional && <p className="mt-3 text-mute">{t.chooseMany}</p>}

              <div className="mt-8">
                {step.kind === "text" && (
                  <input
                    ref={fieldRef}
                    type={step.type ?? "text"}
                    inputMode={step.type === "email" ? "email" : undefined}
                    autoComplete={step.key === "name" ? "name" : step.key === "contact" ? "email" : "off"}
                    autoCapitalize={step.key === "contact" ? "none" : undefined}
                    spellCheck={step.key === "contact" ? false : undefined}
                    value={answers[step.key]}
                    onChange={(e) => set(step.key, e.target.value)}
                    placeholder={step.placeholder}
                    maxLength={step.key === "contact" ? INQUIRY_LIMITS.contact : INQUIRY_LIMITS.name}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "inquiry-error" : undefined}
                    className="w-full border-b border-ink/30 bg-transparent pb-3 font-serif text-[clamp(1.5rem,3.5vw,2.25rem)] font-light outline-none placeholder:text-ink/25 focus:border-ink"
                  />
                )}
                {(step.kind === "choice" || step.kind === "multi") && (
                  <div role={step.kind === "multi" ? "group" : "radiogroup"} aria-labelledby={titleId} className="grid max-w-[560px] gap-2.5">
                    {step.options.map((o, i) => {
                      const selected = step.kind === "multi" ? answers[step.key].includes(o) : answers[step.key] === o;
                      return (
                        <button
                          key={o}
                          type="button"
                          role={step.kind === "multi" ? "checkbox" : "radio"}
                          aria-checked={selected}
                          onClick={() => (step.kind === "multi" ? toggle(step.key, o) : choose(step.key, o))}
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
