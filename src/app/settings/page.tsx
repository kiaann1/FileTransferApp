"use client";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/login");
      } else {
        setUser(data.user);
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
