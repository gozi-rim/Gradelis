import type { NextAuthConfig } from "next-auth"

/** This is used by both auth.ts and proxy.ts, so both of them see the same token and session. */
export const authConfig = {
  secret: process.env.AUTH_SECRET || "gradelis_super_secret_auth_key_2026_secure",
  pages: {
    signIn: "/auth/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.role) {
        session.user.id = token.id ?? session.user.id
        session.user.role = token.role
      }
      return session
    },
  },
  providers: [], // empty here — real providers live in auth.ts
} satisfies NextAuthConfig
