/** A member's Google photo, or their initial on the brand brown. */
export function Avatar({ name, image, size = 48 }: { name: string | null; image: string | null; size?: number }) {
  const initial = (name ?? "A").trim().charAt(0).toUpperCase() || "A";
  return (
    <span className="inline-block shrink-0 overflow-hidden rounded-full border border-gold/50 bg-ink" style={{ width: size, height: size }}>
      {image ? (
        // Google profile photos; next/image would need their host configured.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="grid h-full w-full place-items-center font-serif text-gold" style={{ fontSize: size * 0.42 }}>
          {initial}
        </span>
      )}
    </span>
  );
}
