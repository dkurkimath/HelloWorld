import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getMemberByEmail } from "./data";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Nudges Google's account chooser toward the org's Workspace accounts.
          // This is a hint, not a security boundary — the real check below
          // confirms the signed-in email is an existing member record.
          hd: "sophiaway.org",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const member = await getMemberByEmail(user.email);
      // Only people already seeded as members (by an admin) can sign in —
      // being on the sophiaway.org domain alone isn't enough.
      return !!member;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const member = await getMemberByEmail(user.email);
        if (member) {
          token.memberId = member.id;
          token.isAdmin = member.is_admin;
          token.name = member.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.memberId;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
};
