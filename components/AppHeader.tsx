import { copy } from "@/content/copy";

/** The brown band at the top of each app screen: wordmark, a small label and a title. */
export function AppHeader({ label, title, right, children }: { label: string; title?: string; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="bg-ink px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-7 text-ivory">
      <div className="mx-auto max-w-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="app-wordmark font-serif text-[1.75rem] leading-none font-light tracking-[0.22em]">{copy.brand.wordmark}</p>
            <p className="mt-2 text-[0.6875rem] tracking-[0.3em] text-ivory/70 uppercase">{label}</p>
          </div>
          {right}
        </div>
        {title && <h1 className="mt-6 font-serif text-[1.75rem] leading-tight font-light">{title}</h1>}
        {children}
      </div>
    </header>
  );
}
