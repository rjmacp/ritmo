import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { redirect } from "next/navigation";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { isAllowedEmail } from "@/lib/auth-rules";
import { ensureAthlete } from "@/lib/db/athlete";
import { db } from "@/lib/db/client";
import { accounts, sessions, users, verificationTokens, type Athlete } from "@/lib/db/schema";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Resend({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM })],
  pages: { signIn: "/signin", verifyRequest: "/signin?sent=1" },
  callbacks: {
    signIn: ({ user }) => isAllowedEmail(user.email),
    // `authorized` is what the exported `auth` middleware consults: without it every
    // matched route is allowed through and the pages themselves are the only guard.
    authorized: ({ auth: session }) => !!session?.user,
  },
  events: {
    signIn: async ({ user }) => {
      if (user.email) await ensureAthlete(db, user.email, user.name);
    },
  },
});

/** Returns the signed-in athlete, redirecting to `/signin` when there is no session. */
export async function requireAthlete(): Promise<Athlete> {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  return ensureAthlete(db, session.user.email, session.user.name);
}
