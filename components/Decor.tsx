import Image from "next/image";

/** The Authority logo: a single-stroke, hand-drawn star. */
export const LOGO_PATH =
  "M23.5 42.1C23.3 29 22.8 14.9 22.9 5.9C28.4 14.3 38.9 26.6 45.4 35.4C34.3 29.6 15.5 27.2 2.4 32.5C17.8 23.1 36.6 13.7 45.4 9.3C38.9 14.3 28.4 26.6 25.2 41.7";

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path d={LOGO_PATH} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Ivory-to-gold placeholder block. Pass `src` once a real photo exists and it
 * switches to an optimised next/image.
 */
export function Placeholder({
  label,
  src,
  className = "",
}: {
  label: string;
  src?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden placeholder-gradient ${className}`}>
      {src ? (
        <Image src={src} alt={label.replace(/^Image:\s*/, "")} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-sm italic tracking-wide text-brown/70">
          {label}
        </span>
      )}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm uppercase tracking-[0.25em] text-gold-dark">{children}</p>;
}

export function PageHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-medium text-brown md:text-5xl">{title}</h1>
      {intro && <p className="mx-auto mt-4 max-w-2xl text-lg">{intro}</p>}
      <div className="gold-rule mx-auto mt-6 w-24" role="presentation" />
    </div>
  );
}

export function Container({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return <main className={`mx-auto px-4 py-12 sm:px-6 md:py-16 ${narrow ? "max-w-2xl" : "max-w-6xl"}`}>{children}</main>;
}
