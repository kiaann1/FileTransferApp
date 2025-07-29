"use client";
import React, { createContext, useContext } from "react";


type User = { id: string; email?: string; user_metadata?: { username?: string } } | null;
const UserContext = createContext<User>(null);
export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<User>(null);
  React.useEffect(() => {
    let isMounted = true;
    let subscription: any;
    let supabaseInstance: any;
    const setup = async () => {
      supabaseInstance = (await import("../../lib/supabaseClient")).supabase;
      try {
        const { data, error } = await supabaseInstance.auth.getUser();
        if (isMounted) setCurrentUser(data?.user ?? null);
      } catch (err) {
        if (isMounted) setCurrentUser(null);
      }
      subscription = supabaseInstance.auth.onAuthStateChange((_event: any, session: any) => {
        setCurrentUser(session?.user ?? null);
      });
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
