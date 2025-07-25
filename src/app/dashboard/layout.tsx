import { UserContextProvider } from "./user-context";
import React from "react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

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
    redirect("/login");
  }
  let user;
  try {
    // Validate and decode JWT
    const payload = jwt.verify(sessionCookie.value, process.env.JWT_SECRET || "your_jwt_secret");
    if (typeof payload === "object" && payload !== null) {
      user = {
        id: (payload as unknown as { id: string }).id,
        email: (payload as unknown as { email: string }).email,
        user_metadata: { username: (payload as unknown as { username: string }).username },
      };
    } else {
      redirect("/login");
    }
  } catch (err) {
    redirect("/login");
  }

  // Pass user as prop to children
  return (
    <UserContextProvider user={user}>
      {children}
    </UserContextProvider>
  );
}

