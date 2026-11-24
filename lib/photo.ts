/** A member's photo URL: their uploaded photo if they have one, else their Google photo. */
export function photoUrl(u: { id: string; image: string | null; photoUpdatedAt?: Date | null }) {
  return u.photoUpdatedAt ? `/api/photo/${u.id}?v=${u.photoUpdatedAt.getTime()}` : u.image;
}

export const PHOTO_MAX_BYTES = 1024 * 1024; // after the phone shrinks it, a photo is ~50–150 KB
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
