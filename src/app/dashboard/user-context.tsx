"use client";
import React, { createContext, useContext } from "react";


type User = { id: string; email?: string; user_metadata?: { username?: string } } | null;
const UserContext = createContext<User>(null);
export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<User>(null);
  React.useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    let supabaseInstance: typeof import("../../lib/supabaseClient").supabase;
    const setup = async () => {
      supabaseInstance = (await import("../../lib/supabaseClient")).supabase;
      try {
        const { data } = await supabaseInstance.auth.getUser();
        if (isMounted) setCurrentUser(data?.user ?? null);
      } catch {
        if (isMounted) setCurrentUser(null);
      }
      const { data: { subscription: sub } } = supabaseInstance.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user ?? null);
      });
      subscription = sub;
    };
    setup();
    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, []);
  return <UserContext.Provider value={currentUser}>{children}</UserContext.Provider>;
}
export function useUser() {
  return useContext(UserContext);
}
