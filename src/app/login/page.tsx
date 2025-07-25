"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add sign up form state
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);

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
          <div className="flex gap-2 mb-2">
            <button
              className={`w-full py-2 px-4 rounded font-semibold ${showLoginForm ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setShowLoginForm(true)}
              disabled={loading}
            >
              Login
            </button>
            <button
              className={`w-full py-2 px-4 rounded font-semibold ${!showLoginForm ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setShowLoginForm(false)}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>
          {/* Show login or sign up form based on state */}
          {showLoginForm ? (
            <form onSubmit={async e => {
              e.preventDefault();
              setLoginError("");
              if (!loginEmail.trim() || !loginPassword.trim()) {
                setLoginError("Please enter your email and password.");
                return;
              }
              setLoading(true);
              // Check if user exists and password matches
              const { data: userData, error } = await supabase
                .from("users")
                .select("id, email, password")
                .eq("email", loginEmail.trim())
                .single();
              if (error || !userData) {
                setLoginError("User not found.");
                setLoading(false);
                return;
              }
              if (userData.password !== loginPassword.trim()) {
                setLoginError("Incorrect password.");
                setLoading(false);
                return;
              }
              // Authorise user (simulate login, you may want to use Supabase auth here)
              setLoading(false);
              router.replace("/dashboard");
            }} className="flex flex-col gap-4 mt-4">
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Email</span>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Enter your email" required />
              </label>
              <label className="flex flex-col gap-1 relative">
                <span className="font-medium text-gray-800">Password</span>
                <input type={loginPasswordVisible ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Enter your password" required />
                <button type="button" className="absolute right-2 top-7 text-gray-400 hover:text-blue-600" onClick={() => setLoginPasswordVisible(v => !v)} tabIndex={-1}>
                  {loginPasswordVisible ? "Hide" : "Show"}
                </button>
              </label>
              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
              <button type="submit" className="mt-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">Login</button>
            </form>
          ) : (
            <form onSubmit={async e => {
              e.preventDefault();
              setSignUpError("");
              if (!signUpEmail.trim() || !signUpPassword.trim()) {
                setSignUpError("Please enter a valid email and password.");
                return;
              }
              setLoading(true);
              // Create user in DB
              const { data: existing } = await supabase
                .from("users")
                .select("id")
                .eq("email", signUpEmail.trim())
                .single();
              if (existing) {
                setSignUpError("Email already registered.");
                setLoading(false);
                return;
              }
              const { error } = await supabase
                .from("users")
                .insert([{ email: signUpEmail.trim(), password: signUpPassword.trim() }]);
              if (error) {
                setSignUpError(error.message);
                setLoading(false);
                return;
              }
              setSignUpEmail("");
              setSignUpPassword("");
              setSignUpError("");
              setLoading(false);
              alert("Account created! You can now log in.");
              setShowLoginForm(true);
            }} className="flex flex-col gap-4 mt-4">
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Email</span>
                <input type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Enter your email" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Password</span>
                <input type="password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Enter your password" required />
              </label>
              {signUpError && <div className="text-red-600 text-sm">{signUpError}</div>}
              <button type="submit" className="mt-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">Sign Up</button>
            </form>
          )}
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
