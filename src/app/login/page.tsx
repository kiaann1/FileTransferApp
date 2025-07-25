"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";
import bcrypt from "bcryptjs";

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
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  // Generate a simple captcha (math question)
  function generateCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`What is ${a} + ${b}?`);
    setCaptchaAnswer(String(a + b));
    setCaptchaInput("");
  }
  // Generate captcha on mount and when switching to sign up
  React.useEffect(() => {
    if (!showLoginForm) generateCaptcha();
  }, [showLoginForm]);
  // Add password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthLabel, setPasswordStrengthLabel] = useState("");

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

  // Helper to sanitize input
  function sanitizeInput(input: string) {
    return input.replace(/<[^>]*>?/gm, "").replace(/['"\\;]/g, "");
  }

  // Helper to check password rules
  function getPasswordStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }
  function getStrengthLabel(score: number) {
    if (score <= 2) return "Weak";
    if (score === 3) return "Medium";
    if (score >= 4) return "Strong";
    return "";
  }

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
              try {
                const res = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() })
                });
                const result = await res.json();
                if (!res.ok) {
                  setLoginError(result.error || "Login failed.");
                  setLoading(false);
                  return;
                }
                setLoading(false);
                router.replace("/dashboard");
              } catch (err) {
                setLoginError("Unexpected error: " + (err instanceof Error ? err.message : String(err)));
                setLoading(false);
              }
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
              // Validate all fields
              if (!signUpUsername.trim()) {
                setSignUpError("Please enter a username.");
                return;
              }
              if (!signUpEmail.trim() || !signUpPassword.trim()) {
                setSignUpError("Please enter a valid email and password.");
                return;
              }
              if (signUpPassword !== signUpPasswordConfirm) {
                setSignUpError("Passwords do not match.");
                return;
              }
              if (captchaInput.trim() !== captchaAnswer) {
                setSignUpError("Captcha answer is incorrect.");
                generateCaptcha();
                return;
              }
              if (getPasswordStrength(signUpPassword) < 4) {
                setSignUpError("Password is too weak. Please use a stronger password.");
                return;
              }
              setLoading(true);
              try {
                const res = await fetch("/api/auth/signup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username: signUpUsername.trim(), email: signUpEmail.trim(), password: signUpPassword.trim() })
                });
                const result = await res.json();
                if (!res.ok) {
                  setSignUpError(result.error || "Sign up failed.");
                  setLoading(false);
                  return;
                }
                // Auto-login after sign up
                const loginRes = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: signUpEmail.trim(), password: signUpPassword.trim() })
                });
                const loginResult = await loginRes.json();
                if (!loginRes.ok) {
                  setSignUpError("Account created, but automatic login failed. Please log in manually.");
                  setLoading(false);
                  return;
                }
                setSignUpUsername("");
                setSignUpEmail("");
                setSignUpPassword("");
                setSignUpPasswordConfirm("");
                setCaptchaInput("");
                setSignUpError("");
                setLoading(false);
                router.replace("/dashboard");
              } catch (err) {
                setSignUpError("Unexpected error: " + (err instanceof Error ? err.message : String(err)));
                setLoading(false);
              }
            }} className="flex flex-col gap-4 mt-4">
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Username</span>
                <input
                  type="text"
                  value={signUpUsername}
                  onChange={e => setSignUpUsername(sanitizeInput(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Choose a username"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Email</span>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(sanitizeInput(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter your email"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Password</span>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={e => {
                    const sanitized = sanitizeInput(e.target.value);
                    setSignUpPassword(sanitized);
                    const score = getPasswordStrength(sanitized);
                    setPasswordStrength(score);
                    setPasswordStrengthLabel(getStrengthLabel(score));
                  }}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter your password"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Confirm Password</span>
                <input
                  type="password"
                  value={signUpPasswordConfirm}
                  onChange={e => setSignUpPasswordConfirm(sanitizeInput(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Re-enter your password"
                  required
                />
              </label>
              {/* Password strength bar */}
              <div className="h-2 w-full bg-gray-200 rounded mt-1 mb-1">
                <div
                  className={`h-2 rounded ${passwordStrength <= 2 ? 'bg-red-500' : passwordStrength === 3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                ></div>
              </div>
              <div className={`text-sm ${passwordStrength <= 2 ? 'text-red-600' : passwordStrength === 3 ? 'text-yellow-600' : 'text-green-600'}`}>{passwordStrengthLabel}</div>
              {/* Captcha */}
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Captcha: {captchaQuestion}</span>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(sanitizeInput(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Answer the question above"
                  required
                />
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
