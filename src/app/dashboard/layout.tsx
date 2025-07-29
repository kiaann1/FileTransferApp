"use client";
import { UserContextProvider } from "./user-context";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // User context is provided client-side only
  return (
    <UserContextProvider>
      {children}
    </UserContextProvider>
  );
}

