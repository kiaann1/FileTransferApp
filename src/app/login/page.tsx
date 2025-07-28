"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col items-center p-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-blue-900">Sign in to FileTransfer</h1>
          <p className="text-gray-600 mb-6">Access your galleries, teams, and files securely.</p>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4 font-semibold"
            onClick={handleLogin}
            disabled={loading}
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
