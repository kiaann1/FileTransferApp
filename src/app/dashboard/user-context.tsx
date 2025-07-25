"use client";
import React, { createContext, useContext } from "react";


type User = { id: string; email: string; user_metadata?: { username?: string } } | null;
const UserContext = createContext<User>(null);
export function UserContextProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
export function useUser() {
  return useContext(UserContext);
}
