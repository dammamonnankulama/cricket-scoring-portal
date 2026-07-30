import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // real providers are added in auth.ts, not here
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnMatch = nextUrl.pathname.startsWith("/match");

      if (isOnDashboard || isOnMatch) {
        return isLoggedIn; 
      }
      return true;
    },
  },
};