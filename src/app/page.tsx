"use client";
import Link from "next/link";
import { useState } from "react";
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
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Dashboard</Link>
              <Link href="/account" className="px-4 py-2 rounded bg-gray-100 text-blue-700 font-medium hover:bg-gray-200 transition">Account</Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Sign In</Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center pt-32 pb-20 bg-gray-50">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 text-center leading-tight">Effortless File Management for Teams</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-xl text-center">Organize, share, and protect your files with a privacy-first SaaS platform. Fast, secure, and designed for modern collaboration.</p>
        <div className="flex gap-4 mb-8">
          <Link href="/login" className="px-6 py-3 rounded-lg bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">Get Started Free</Link>
          <Link href="/login" className="px-6 py-3 rounded-lg bg-gray-100 text-blue-700 text-lg font-semibold shadow hover:bg-gray-200 transition">See Features</Link>
        </div>
        <div className="w-full max-w-2xl flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-4 w-full">
            <div className="w-full h-56 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-blue-700 text-xl font-bold">Your files, beautifully organized.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
          <svg width="40" height="40" fill="none" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" rx="4" fill="#2563EB"/><rect x="10" y="14" width="12" height="4" rx="2" fill="white"/></svg>
          <h3 className="font-bold text-lg text-gray-900 mt-4 mb-2">Secure Storage</h3>
          <p className="text-gray-500 text-center">Your files are encrypted and protected with industry-leading security.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
          <svg width="40" height="40" fill="none" viewBox="0 0 32 32"><rect x="4" y="10" width="24" height="12" rx="3" fill="#FBBF24"/><rect x="4" y="6" width="10" height="8" rx="2" fill="#FDE68A"/></svg>
          <h3 className="font-bold text-lg text-gray-900 mt-4 mb-2">Team Collaboration</h3>
          <p className="text-gray-500 text-center">Share folders, invite teammates, and work together in real time.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
          <svg width="40" height="40" fill="none" viewBox="0 0 32 32"><rect x="4" y="32" width="24" height="8" rx="2" fill="#E0E7FF"/><ellipse cx="16" cy="36" rx="4" ry="2" fill="#2563EB"/></svg>
          <h3 className="font-bold text-lg text-gray-900 mt-4 mb-2">Privacy-First AI</h3>
          <p className="text-gray-500 text-center">Find files instantly with smart search, powered by privacy-first AI.</p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full max-w-4xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Trusted by teams and creators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-700 italic mb-4">“FileTransfer has made our workflow so much smoother. The privacy features are a game changer!”</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">A</div>
              <div>
                <div className="font-semibold text-gray-900">Alex, Designer</div>
                <div className="text-gray-400 text-sm">Acme Studio</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-700 italic mb-4">“The best file management SaaS for teams. Fast, secure, and easy to use.”</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">J</div>
              <div>
                <div className="font-semibold text-gray-900">Jamie, Project Lead</div>
                <div className="text-gray-400 text-sm">BrightTech</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t py-8 mt-8 flex flex-col items-center">
        <div className="flex gap-6 mb-4">
          <Link href="/privacy" className="text-gray-500 hover:text-blue-600">Privacy Policy</Link>
          <Link href="/terms" className="text-gray-500 hover:text-blue-600">Terms of Service</Link>
          <Link href="/contact" className="text-gray-500 hover:text-blue-600">Contact</Link>
        </div>
        <div className="text-gray-400 text-sm">© {new Date().getFullYear()} All rights reserved.</div>
      </footer>
    </main>
  );
}
