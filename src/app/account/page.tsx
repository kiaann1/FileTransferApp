"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { User, Provider } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ notifications: true });
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        setDisplayName(data.user.user_metadata?.full_name || "");
      } else {
        router.push("/login");
      }
    };

    fetchUser();
  }, [router]);

  // Add a stub for handleLogout to avoid reference error
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDisplayNameSave = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
    if (!error && user) {
      setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: displayName } });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleConnectAccount = async (provider: Provider) => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2563EB"/>
            <path d="M10 16L16 10L22 16L16 22L10 16Z" fill="white"/>
          </svg>
          <span className="font-bold text-xl text-blue-700">FileTransfer</span>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard" className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Dashboard</Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Profile Card */}
      <section className="w-full max-w-xl mx-auto py-12 px-6 bg-white rounded-xl shadow mt-12 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="18" r="10" fill="#2563EB"/><rect x="8" y="32" width="32" height="10" rx="5" fill="#DBEAFE"/></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{user?.email}</h1>
        <div className="text-gray-500 mb-6">Member since {user?.created_at?.slice(0, 10)}</div>

        {/* Editable Display Name */}
        <div className="mb-6 w-full flex flex-col items-center">
          <label htmlFor="displayName" className="font-semibold text-gray-700 mb-1">Display Name</label>
          <div className="flex gap-2 w-2/3">
            <input
              id="displayName"
              type="text"
              className="border rounded px-3 py-2 flex-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add your name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={!editing}
            />
            {!editing ? (
              <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm font-medium" onClick={() => setEditing(true)}>
                Edit
              </button>
            ) : (
              <button className="px-3 py-2 rounded bg-green-500 text-white text-sm font-medium" onClick={handleDisplayNameSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            )}
            {editing && (
              <button className="px-3 py-2 rounded bg-gray-300 text-gray-700 text-sm font-medium" onClick={() => { setEditing(false); setDisplayName(user?.user_metadata?.full_name || ""); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
        {/* Settings Section */}
        <div className="mb-6 w-full flex flex-col items-center">
          <h2 className="font-semibold text-gray-700 mb-2">Settings</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={e => setSettings(s => ({ ...s, notifications: e.target.checked }))}
              className="accent-blue-600"
            />
            <span className="text-gray-600">Email notifications</span>
          </label>
        </div>
        {/* Connect Additional Accounts */}
        <div className="mb-6 w-full flex flex-col items-center">
          <h2 className="font-semibold text-gray-700 mb-2">Connect Additional Accounts</h2>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded bg-gray-100 text-blue-700 font-medium border hover:bg-blue-50"
              onClick={() => handleConnectAccount("google")}
            >
              Google
            </button>
            <button
              className="px-4 py-2 rounded bg-gray-100 text-blue-700 font-medium border hover:bg-blue-50"
              onClick={() => handleConnectAccount("github")}
            >
              GitHub
            </button>
            <button
              className="px-4 py-2 rounded bg-gray-100 text-blue-700 font-medium border hover:bg-blue-50"
              onClick={() => handleConnectAccount("azure")}
            >
              Azure
            </button>
          </div>
        </div>

        <div className="mb-6 w-full flex flex-col items-center">
          <Link href="/account/password" className="text-blue-600 hover:underline text-sm">Change Password</Link>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="font-semibold text-gray-700">User ID:</span>
            <div className="text-gray-900 break-all text-sm mt-1">{user?.id}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="font-semibold text-gray-700">Email:</span>
            <div className="text-gray-900 text-sm mt-1">{user?.email}</div>
          </div>
        </div>

        {/* Future: Add more settings, API keys, notifications, etc. */}
      </section>

      <footer className="w-full bg-white border-t py-8 mt-8 flex flex-col items-center">
        <div className="flex gap-6 mb-4">
          <Link href="/privacy" className="text-gray-500 hover:text-blue-600">Privacy Policy</Link>
          <Link href="/terms" className="text-gray-500 hover:text-blue-600">Terms of Service</Link>
          <Link href="/contact" className="text-gray-500 hover:text-blue-600">Contact</Link>
        </div>
        <div className="text-gray-400 text-sm">© {new Date().getFullYear()} FileTransfer. All rights reserved.</div>
      </footer>
    </main>
  );
}
