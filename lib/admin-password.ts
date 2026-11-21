import "server-only";
import { scryptSync, timingSafeEqual } from "node:crypto";

// Admin password login. The password is never stored: ADMIN_PASSWORD_HASH holds
// "scrypt$<salt hex>$<hash hex>", made by scripts/set-admin-password.mjs.

const KEYLEN = 64;

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminLoginConfigured() {
  return !!process.env.ADMIN_USERNAME && !!process.env.ADMIN_PASSWORD_HASH;
}

/** True when both username and password match. Always does the full hash work, so timing reveals nothing. */
export function checkAdminCredentials(username: string, password: string) {
  const expectedUser = (process.env.ADMIN_USERNAME ?? "").trim().toLowerCase();
  const [scheme, saltHex, hashHex] = (process.env.ADMIN_PASSWORD_HASH ?? "").trim().split("$");
  if (!expectedUser || scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), KEYLEN);
  const passOk = safeEqual(actual, Buffer.from(hashHex, "hex"));
  const userOk = safeEqual(Buffer.from(username.trim().toLowerCase()), Buffer.from(expectedUser));
  return passOk && userOk;
}
