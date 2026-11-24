"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { removePhoto, uploadPhoto } from "@/app/actions/profile";
import { Avatar } from "@/components/Avatar";
import { copy } from "@/content/copy";
import type { ActionState } from "@/lib/validation";

const t = copy.app.photo;
const SIZE = 512;

/** Crops the picked image to a centred square and shrinks it to a 512px JPEG, on the phone. */
async function prepare(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.86));
}

/** Change or remove the member's photo. */
export function PhotoUpload({ name, current, hasUploaded }: { name: string | null; current: string | null; hasUploaded: boolean }) {
  const [upState, upload] = useActionState(uploadPhoto, {} as ActionState);
  const [rmState, remove] = useActionState(removePhoto, {} as ActionState);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const state = rmState.message && !upState.message ? rmState : upState;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still triggers a change
    if (!file) return;
    setError(null);
    try {
      const blob = await prepare(file);
      setPreview(URL.createObjectURL(blob));
      const fd = new FormData();
      fd.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      start(() => upload(fd));
    } catch {
      setError(t.invalid);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <Avatar name={name} image={preview ?? current} size={88} />
      <div className="min-w-0">
        <input ref={input} type="file" accept="image/*" onChange={onPick} className="sr-only" id="photo-input" />
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
    </div>
  );
}
