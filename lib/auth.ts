import "server-only";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      const google = profile as GoogleProfile | undefined;
      if (!google?.email || !google.email_verified) return "/signin?error=unverified";

      const email = google.email.toLowerCase();
      const role = adminEmails().includes(email) ? "ADMIN" : "MEMBER";
      const existing = await db.user.findUnique({ where: { email } });

      if (!existing) {
        // First sign-in: create the account. `email` is unique, so a parallel
        // first sign-in cannot create a second account.
        try {
          const user = await db.user.create({
            data: { email, googleId: account.providerAccountId, name: google.name, image: google.picture, role },
          });
          if (role === "ADMIN") {
            await audit(db, { actorId: null, action: "role.grant_admin", targetType: "user", targetId: user.id, details: { source: "ADMIN_EMAILS" } });
          }
        } catch (err) {
          if ((err as { code?: string }).code !== "P2002") throw err;
        }
        return true;
      }

      if (existing.googleId && existing.googleId !== account.providerAccountId) return "/signin?error=default";
      if (existing.status === "SUSPENDED") return "/signin?error=suspended";

      await db.user.update({
        where: { id: existing.id },
        data: { googleId: account.providerAccountId, image: google.picture, role },
      });
      if (existing.role !== role) {
        await audit(db, {
          actorId: null,
          action: role === "ADMIN" ? "role.grant_admin" : "role.revoke_admin",
          targetType: "user",
          targetId: existing.id,
          details: { source: "ADMIN_EMAILS" },
        });
      }
      return true;
    },

    async jwt({ token, account }) {
      if (account && token.email) {
        const user = await db.user.findUnique({ where: { email: token.email.toLowerCase() }, select: { id: true } });
        token.uid = user?.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) session.user.id = token.uid as string | undefined;
      return session;
    },
  },
};
