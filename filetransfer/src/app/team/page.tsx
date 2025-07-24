import { supabase } from "@/lib/supabaseClient";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  // Example: fetch teams for the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch teams, members, invites, etc. here
  // ...

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Team Management</h1>
      {/* Team management UI will go here */}
    </div>
  );
}
