"use client";
import { supabase } from "@/lib/supabaseClient";
// import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  // const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add internal sign up modal state
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpError, setSignUpError] = useState("");

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
          <button
            className="w-full py-2 px-4 bg-gray-700 text-white rounded hover:bg-gray-800 mb-2 font-semibold"
            onClick={() => setShowSignUpModal(true)}
            disabled={loading}
          >
            Sign Up (Internal)
          </button>
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
      {showSignUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => { setShowSignUpModal(false); setSignUpEmail(""); setSignUpPassword(""); setSignUpError(""); }}>
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl" onClick={() => { setShowSignUpModal(false); setSignUpEmail(""); setSignUpPassword(""); setSignUpError(""); }} aria-label="Close">&times;</button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign Up</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              setSignUpError("");
              if (!signUpEmail.trim() || !signUpPassword.trim()) {
                setSignUpError("Please enter a valid email and password.");
                return;
              }
              // Sign up with Supabase auth
              const { data, error } = await supabase.auth.signUp({
                email: signUpEmail.trim(),
                password: signUpPassword.trim(),
              });
              if (error) {
                setSignUpError(error.message);
                return;
              }
              setShowSignUpModal(false);
              setSignUpEmail("");
              setSignUpPassword("");
              setSignUpError("");
              alert("Account created! Check your email for a confirmation link.");
            }} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Email</span>
                <input type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Enter your email" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Password</span>
                <input type="password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Enter your password" required />
              </label>
              {signUpError && <div className="text-red-600 text-sm">{signUpError}</div>}
              <button type="submit" className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">Sign Up</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
