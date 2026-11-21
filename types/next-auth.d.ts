import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & { id?: string };
    /** How this session signed in ("google" or "admin-login") and when (ms since epoch). */
    method?: string;
    loginAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    method?: string;
    loginAt?: number;
  }
}
