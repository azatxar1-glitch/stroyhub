import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config (no Prisma adapter, no bcrypt).
 * Used by middleware.ts, which runs on the Edge runtime and cannot
 * load Prisma's native engine. The full config lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
