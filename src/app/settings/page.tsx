"use client";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();
  // User state is fetched but not used. Remove if not needed, or use in UI below.
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/login");
      }
    };
    fetchUser();
  }, [router]);
  // Fetch profile, storage usage, password prefs, etc. here (client-side)
  // ...existing code...
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      {/* Settings UI will go here */}
    </div>
  );
}
