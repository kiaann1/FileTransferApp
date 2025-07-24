"use client";
// ...existing code...
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (provider: "google" | "email") => {
    setLoading(true);
    setError("");
    if (provider === "google") {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) setError(error.message);
    }
    // Email login can be added here
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left column: headline and login */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-blue-900">Sign in to FileTransfer</h1>
          <p className="text-gray-600 mb-6">Access your galleries, teams, and files securely.</p>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4 font-semibold"
            onClick={() => handleLogin("google")}
            disabled={loading}
          >
            Continue with Google
          </button>
          {/* Email login UI can be added here */}
        </div>
        {/* Right column: illustration or video */}
        <div className="hidden md:flex items-center justify-center bg-blue-50">
          <video
            src="https://aem.dropbox.com/cms/content/dam/dropbox/warp/en-us/index/april-2025-launch/hero/dash-multimedia-search-homepage-ui-transparent-1080xauto-v3.webm"
            autoPlay
            loop
            muted
            playsInline
            className="rounded-xl shadow w-full max-w-xs border border-blue-100"
            poster="https://aem.dropbox.com/cms/content/dam/dropbox/warp/en-us/index/april-2025-launch/hero/dash-multimedia-search-homepage-ui-transparent-1080xauto-v3.jpg"
          />
        </div>
      </div>
    </div>
  );
}
