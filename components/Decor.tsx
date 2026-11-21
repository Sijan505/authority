import Image from "next/image";

/** Small hand-drawn star that sits above the wordmark. */
export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="star-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B5E1A" />
          <stop offset="1" stopColor="#C9900F" />
        </linearGradient>
      </defs>
      <path
        d="M24.4 4.8c1.2 4.6 2.3 9.9 3.9 14.1 4.8.4 9.6.2 14.6 1.1-3.6 3.2-8 5.9-11.6 9.2 1.5 4.9 3.3 9.4 4.4 14.1-4.2-2.6-7.9-5.6-11.6-8.2-3.9 2.8-7.8 5.6-12 8.6 1.4-5 3.1-9.6 4.6-14.4-3.8-3-7.9-5.7-11.6-9 4.8-.6 9.8-.4 14.5-.9 1.7-4.7 3.1-9.5 4.8-14.6Z"
        stroke="url(#star-gold)"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
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
