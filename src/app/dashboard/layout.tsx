import { UserContextProvider } from "./user-context";
import React from "react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export type User = {
  id: string;
  email: string;
  user_metadata?: { username?: string };
  app_metadata?: object;
  aud?: string;
  created_at?: string;
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Get session cookie from request (server-side)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    throw new Error("[DASHBOARD] No session cookie found. Cannot authenticate user.");
  }
  let user = null;
  try {
    // Validate and decode JWT
    const jwtSecret = process.env.JWT_SECRET || "changeme";
    const payload = jwt.verify(sessionCookie.value, jwtSecret);
    if (typeof payload === "object" && payload !== null) {
      user = {
        id: (payload as { id: string }).id,
        email: (payload as { email: string }).email,
        user_metadata: { username: (payload as { username: string }).username },
      };
      // Debug info for valid session
    } else {
      throw new Error(`[DASHBOARD] JWT payload invalid. Cookie: ${sessionCookie.value}`);
    }
  } catch (err) {
    throw new Error(`[DASHBOARD] JWT verification failed: ${err}. Cookie: ${sessionCookie.value}. Secret: ${process.env.JWT_SECRET}`);
  }

  // Pass user as prop to children
  return (
    <UserContextProvider user={user}>
      {children}
    </UserContextProvider>
  );
}

