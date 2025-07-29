"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push("/");
  };

  useEffect(() => {
    // Check session on mount
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setLoggedIn(!!data?.session);
    };
    checkSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8fa] flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-4 sm:px-8 py-6 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/file.svg" alt="Logo" className="h-10 w-auto" />
          <span className="font-bold text-xl text-[#6c63ff]">FileTransfer</span>
        </div>
        <div className="flex gap-2 sm:gap-4">
          {loggedIn && (
            <Link href="/dashboard" className="px-3 py-2 sm:px-4 sm:py-2 rounded bg-[#6c63ff] text-white font-medium hover:bg-[#5548c8] transition text-sm sm:text-base">Dashboard</Link>
          )}
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600 transition text-sm sm:text-base"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="px-3 py-2 sm:px-4 sm:py-2 rounded bg-gray-100 text-[#6c63ff] font-medium hover:bg-gray-200 transition text-sm sm:text-base">Login</Link>
          )}
        </div>
      </nav>
      {/* Main content */}
      <div className="w-full flex-1 px-4 sm:px-12 py-8 sm:py-10">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center pt-10 sm:pt-20 pb-8 sm:pb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4 sm:mb-6 text-center leading-tight">Effortless File Management for Teams</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-xl text-center">Organize, share, and protect your files with a privacy-first SaaS platform. Fast, secure, and designed for modern collaboration.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 w-full max-w-xs sm:max-w-none">
            <Link href="/login" className="px-5 py-3 rounded-lg bg-[#6c63ff] text-white text-base sm:text-lg font-semibold shadow hover:bg-[#5548c8] transition w-full sm:w-auto text-center">Get Started Free</Link>
            <Link href="/login" className="px-5 py-3 rounded-lg bg-gray-100 text-[#6c63ff] text-base sm:text-lg font-semibold shadow hover:bg-gray-200 transition w-full sm:w-auto text-center">See Features</Link>
          </div>
          <div className="w-full max-w-md sm:max-w-2xl flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-4 w-full">
              <div className="w-full h-40 sm:h-56 bg-gradient-to-br from-[#f3f4fe] to-[#e0e7ff] rounded-lg flex items-center justify-center">
                <span className="text-[#6c63ff] text-lg sm:text-xl font-bold">Your files, beautifully organized.</span>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section className="w-full max-w-5xl mx-auto py-10 sm:py-16 px-2 sm:px-4 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white rounded-xl shadow p-6 sm:p-8 flex flex-col items-center">
            <svg width="40" height="40" fill="none" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" rx="4" fill="#6c63ff"/><rect x="10" y="14" width="12" height="4" rx="2" fill="white"/></svg>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 mt-3 sm:mt-4 mb-1 sm:mb-2">Secure Storage</h3>
            <p className="text-gray-500 text-center text-sm sm:text-base">Your files are encrypted and protected with industry-leading security.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 sm:p-8 flex flex-col items-center">
            <svg width="40" height="40" fill="none" viewBox="0 0 32 32"><rect x="4" y="10" width="24" height="12" rx="3" fill="#FBBF24"/><rect x="4" y="6" width="10" height="8" rx="2" fill="#FDE68A"/></svg>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 mt-3 sm:mt-4 mb-1 sm:mb-2">Team Collaboration</h3>
            <p className="text-gray-500 text-center text-sm sm:text-base">Share folders, invite teammates, and work together in real time.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 sm:p-8 flex flex-col items-center">
            <svg width="40" height="40" fill="none" viewBox="0 0 32 32"><rect x="4" y="32" width="24" height="8" rx="2" fill="#E0E7FF"/><ellipse cx="16" cy="36" rx="4" ry="2" fill="#6c63ff"/></svg>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 mt-3 sm:mt-4 mb-1 sm:mb-2">Privacy-First AI</h3>
            <p className="text-gray-500 text-center text-sm sm:text-base">Find files instantly with smart search, powered by privacy-first AI.</p>
          </div>
        </section>
        {/* Depth Section - Add visual substance */}
        <section className="w-full max-w-6xl mx-auto py-10 sm:py-16 px-2 sm:px-4 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          <div className="bg-gradient-to-br from-[#f3f4fe] via-white to-[#e0e7ff] rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col items-center border border-[#e0e7ff]">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#6c63ff] mb-3 sm:mb-4">Why FileTransfer?</h2>
            <ul className="space-y-3 sm:space-y-4 w-full">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="inline-block w-8 h-8 bg-[#e0e7ff] rounded-full flex items-center justify-center text-[#6c63ff] font-bold">1</span>
                <div>
                  <span className="font-semibold text-gray-900">Instant Setup</span>
                  <div className="text-gray-500 text-xs sm:text-sm">Get started in seconds with no complex onboarding.</div>
                </div>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="inline-block w-8 h-8 bg-[#e0e7ff] rounded-full flex items-center justify-center text-[#6c63ff] font-bold">2</span>
                <div>
                  <span className="font-semibold text-gray-900">Real-Time Collaboration</span>
                  <div className="text-gray-500 text-xs sm:text-sm">Work together with your team, live and securely.</div>
                </div>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="inline-block w-8 h-8 bg-[#e0e7ff] rounded-full flex items-center justify-center text-[#6c63ff] font-bold">3</span>
                <div>
                  <span className="font-semibold text-gray-900">AI-Powered Search</span>
                  <div className="text-gray-500 text-xs sm:text-sm">Find files instantly with privacy-first AI search.</div>
                </div>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="inline-block w-8 h-8 bg-[#e0e7ff] rounded-full flex items-center justify-center text-[#6c63ff] font-bold">4</span>
                <div>
                  <span className="font-semibold text-gray-900">Enterprise Security</span>
                  <div className="text-gray-500 text-xs sm:text-sm">Your files are encrypted and protected at every step.</div>
                </div>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-[#e0e7ff] w-full max-w-md">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">See FileTransfer in Action</h3>
              <div className="w-full h-32 sm:h-56 bg-gradient-to-br from-[#f3f4fe] to-[#e0e7ff] rounded-lg flex items-center justify-center mb-2 sm:mb-4">
                <span className="text-[#6c63ff] text-base sm:text-xl font-bold">[Product Screenshot / Demo Animation]</span>
              </div>
              <ul className="space-y-1 sm:space-y-2">
                <li className="text-gray-600 text-xs sm:text-sm">✔ Drag & drop uploads</li>
                <li className="text-gray-600 text-xs sm:text-sm">✔ Folder sharing</li>
                <li className="text-gray-600 text-xs sm:text-sm">✔ Secure previews</li>
                <li className="text-gray-600 text-xs sm:text-sm">✔ Team management</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
      {/* Footer */}
      <footer className="w-full bg-white border-t py-6 sm:py-8 mt-8 flex flex-col items-center">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4">
          <Link href="/privacy" className="text-gray-500 hover:text-[#6c63ff]">Privacy Policy</Link>
          <Link href="/terms" className="text-gray-500 hover:text-[#6c63ff]">Terms of Service</Link>
          <Link href="/contact" className="text-gray-500 hover:text-[#6c63ff]">Contact</Link>
        </div>
        <div className="text-gray-400 text-xs sm:text-sm">© {new Date().getFullYear()} All rights reserved.</div>
      </footer>
    </main>
  );
}
