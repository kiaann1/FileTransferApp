"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      } else {
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading account...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center">
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

      <section className="w-full max-w-xl mx-auto py-16 px-4 bg-white rounded-xl shadow mt-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Account Details</h1>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Email:</span>
          <span className="ml-2 text-gray-900">{user.email}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">User ID:</span>
          <span className="ml-2 text-gray-900">{user.id}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Created At:</span>
          <span className="ml-2 text-gray-900">{user.created_at}</span>
        </div>
        {/* Add more user info or settings here */}
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
