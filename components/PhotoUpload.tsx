"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { removePhoto, uploadPhoto } from "@/app/actions/profile";
import { Avatar } from "@/components/Avatar";
import { copy } from "@/content/copy";
import type { ActionState } from "@/lib/validation";

const t = copy.app.photo;
const OUT = 512; // saved photo: 512×512 JPEG
const MAX_SOURCE = 2048; // big phone photos are scaled down first to save memory
const MAX_ZOOM = 4;

/** Decodes the picked file the right way up, scaled to at most MAX_SOURCE px. */
async function decode(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const k = Math.min(1, MAX_SOURCE / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bitmap.width * k);
  c.height = Math.round(bitmap.height * k);
  c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
  bitmap.close();
  return c;
}

/** A copy of the canvas turned 90° clockwise. */
function rotate(src: HTMLCanvasElement) {
  const c = document.createElement("canvas");
  c.width = src.height;
  c.height = src.width;
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  return c;
}

type View = { zoom: number; x: number; y: number };

/**
 * Lets the member position the photo in a round frame (drag), zoom it (pinch, slider
 * or mouse wheel) and turn it, then returns exactly the framed square as a JPEG.
 */
function Adjuster({ source, onCancel, onDone }: { source: HTMLCanvasElement; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const [canvas, setCanvas] = useState(source);
  const [url, setUrl] = useState<string>("");
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [frame, setFrame] = useState(280);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  // Preview image for the current (possibly rotated) canvas.
  useEffect(() => {
    let alive = true;
    let made = "";
    canvas.toBlob((b) => {
      if (!alive || !b) return;
      made = URL.createObjectURL(b);
      setUrl(made);
    }, "image/jpeg", 0.9);
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [canvas]);

  // The frame is 280px, or smaller on narrow phones.
  useEffect(() => {
    const measure = () => frameRef.current && setFrame(frameRef.current.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const base = frame / Math.min(canvas.width, canvas.height); // "cover" the frame at zoom 1
  const scale = base * view.zoom;

  /** Keeps the photo covering the whole frame, so there are never empty edges. */
  const clamp = (v: View): View => {
    const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom));
    const s = base * zoom;
    const maxX = Math.max(0, (canvas.width * s - frame) / 2);
    const maxY = Math.max(0, (canvas.height * s - frame) / 2);
    return { zoom, x: Math.min(maxX, Math.max(-maxX, v.x)), y: Math.min(maxY, Math.max(-maxY, v.y)) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.zoom };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setView((v) => clamp({ ...v, zoom: (pinch.current!.zoom * dist) / pinch.current!.dist }));
    } else if (pointers.current.size === 1) {
      setView((v) => clamp({ ...v, x: v.x + next.x - prev.x, y: v.y + next.y - prev.y }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const onWheel = (e: React.WheelEvent) => setView((v) => clamp({ ...v, zoom: v.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08) }));

  const turn = () => {
    setCanvas((c) => rotate(c));
    setView({ zoom: 1, x: 0, y: 0 });
  };

  /** Draws exactly what's inside the frame onto a 512×512 canvas. */
  const save = () => {
    const side = frame / scale; // frame size in source pixels
    const sx = canvas.width / 2 - (frame / 2 + view.x) / scale;
    const sy = canvas.height / 2 - (frame / 2 + view.y) / scale;
    const out = document.createElement("canvas");
    out.width = out.height = OUT;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, sx, sy, side, side, 0, 0, OUT, OUT);
    out.toBlob((b) => b && onDone(b), "image/jpeg", 0.86);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="adjust-h" className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-ink px-5 text-ivory">
      <h2 id="adjust-h" className="font-serif text-[1.5rem] font-light">
        {t.adjust}
      </h2>
      <p className="mt-1 text-sm text-ivory/70">{t.adjustHint}</p>

      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className="relative mt-8 aspect-square w-[min(280px,78vw)] cursor-grab touch-none overflow-hidden rounded-full select-none active:cursor-grabbing"
        style={{ boxShadow: "0 0 0 2px rgba(200,150,42,0.8)" }}
      >
        {url && (
          // A local preview of the picked file; next/image doesn't apply to blob URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            draggable={false}
            className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
            style={{
              width: canvas.width,
              height: canvas.height,
              transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})`,
            }}
          />
        )}
      </div>

      <div className="mt-8 flex w-[min(280px,78vw)] items-center gap-3">
        <span aria-hidden="true" className="text-sm">−</span>
        <label htmlFor="photo-zoom" className="sr-only">
          {t.zoom}
        </label>
        <input
          id="photo-zoom"
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={view.zoom}
          onChange={(e) => setView((v) => clamp({ ...v, zoom: Number(e.target.value) }))}
          className="flex-1 accent-[#c8962a]"
        />
        <span aria-hidden="true" className="text-sm">+</span>
      </div>

      <div className="mt-8 flex w-[min(320px,86vw)] flex-wrap justify-center gap-3">
        <button type="button" onClick={turn} className="btn btn-sm border-ivory/40 bg-transparent text-ivory">
          ↻ {t.rotate}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-sm border-ivory/40 bg-transparent text-ivory">
          {t.cancel}
        </button>
        <button type="button" onClick={save} disabled={!url} className="btn btn-light btn-sm">
          {t.save}
        </button>
      </div>
    </div>
  );
}

/** Change, adjust or remove the member's photo. */
export function PhotoUpload({ name, current, hasUploaded }: { name: string | null; current: string | null; hasUploaded: boolean }) {
  const [upState, upload] = useActionState(uploadPhoto, {} as ActionState);
  const [rmState, remove] = useActionState(removePhoto, {} as ActionState);
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const state = rmState.message && !upState.message ? rmState : upState;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still triggers a change
    if (!file) return;
    setError(null);
    try {
      setSource(await decode(file));
    } catch {
      setError(t.invalid);
    }
  };

  const onDone = (blob: Blob) => {
    setSource(null);
    setPreview(URL.createObjectURL(blob));
    const fd = new FormData();
    fd.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
    start(() => upload(fd));
  };

  return (
    <div className="flex items-center gap-5">
      <Avatar name={name} image={preview ?? current} size={88} />
      <div className="min-w-0">
        <input type="file" accept="image/*" onChange={onPick} className="sr-only" id="photo-input" />
        <div className="flex flex-wrap gap-2">
          <label htmlFor="photo-input" className={`btn btn-sm cursor-pointer ${pending ? "pointer-events-none opacity-60" : ""}`}>
            {pending ? t.saving : current || preview ? t.change : t.add}
          </label>
          {hasUploaded && !preview && (
            <button type="button" className="btn btn-sm btn-alt" disabled={pending} onClick={() => start(() => remove())}>
              {t.remove}
            </button>
          )}
        </div>
        <p className={`mt-2 text-sm ${error || (state.message && !state.ok) ? "text-error" : "text-mute"}`} aria-live="polite">
          {error ?? state.message ?? t.hint}
        </p>
      </div>
      {source && <Adjuster source={source} onCancel={() => setSource(null)} onDone={onDone} />}
    </div>
  );
}
