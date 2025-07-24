import { supabase } from "../../lib/supabaseClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile, storage usage, password prefs, etc. here
  // ...

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      {/* Settings UI will go here */}
    </div>
  );
}
