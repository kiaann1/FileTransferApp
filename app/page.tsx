"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-6 bg-white shadow-sm fixed top-0 left-0 z-10">
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
              <Link href="/account" className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Account</Link>
              <Link href="/dashboard" className="px-4 py-2 rounded bg-gray-100 text-blue-700 font-medium hover:bg-gray-200 transition">Dashboard</Link>
            </>
          ) : (
            <Link href="/login" className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Sign In</Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full flex flex-col md:flex-row items-center justify-center pt-32 pb-20 bg-white">
        <div className="flex-1 flex flex-col items-start justify-center px-8">
          <h1 className="text-5xl font-extrabold text-blue-900 mb-6 leading-tight">Find anything.<br/>Protect everything.</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md">Find, organize, and protect your work with FileTransfer. Secure, fast, and enhanced by privacy-first AI capabilities. Modern SaaS experience for teams and creators.</p>
          <div className="flex gap-4 mb-8">
            <Link href="/login" className="px-6 py-3 rounded-lg bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">What's new with us</Link>
            <Link href="/login" className="px-6 py-3 rounded-lg bg-gray-100 text-blue-700 text-lg font-semibold shadow hover:bg-gray-200 transition">Try FileTransfer free</Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-md">
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-blue-700 text-xl font-bold">[Product Screenshot / Demo Animation]</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="w-full flex flex-col items-center py-6 bg-gray-50">
        <span className="text-gray-400 text-xs uppercase tracking-widest mb-2">Trusted by teams and creators</span>
        <div className="flex gap-6">
          <svg width="80" height="24" viewBox="0 0 80 24" fill="none"><rect width="80" height="24" rx="6" fill="#F3F4F6"/></svg>
          <svg width="80" height="24" viewBox="0 0 80 24" fill="none"><rect width="80" height="24" rx="6" fill="#F3F4F6"/></svg>
          <svg width="80" height="24" viewBox="0 0 80 24" fill="none"><rect width="80" height="24" rx="6" fill="#F3F4F6"/></svg>
        </div>
      </div>

      {/* Protect Content Section */}
      <section className="w-full flex flex-col items-center py-20 bg-white">
        <span className="mb-2 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-500">File protection</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Protect all your content</h2>
        <p className="text-gray-500 mb-6 text-center max-w-lg">Each upload is encrypted and stored securely with client-side encryption. AI-powered search and content classification keeps your information safe and discoverable.</p>
        <Link href="/login" className="px-6 py-2 rounded-lg bg-blue-600 text-white text-md font-semibold shadow hover:bg-blue-700 transition">Learn more</Link>
        <div className="mt-10 w-full flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-700 text-lg font-bold">[App Screenshot]</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-700 text-lg font-bold">[App Screenshot]</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full flex flex-col items-center py-20 bg-gray-50">
        <span className="mb-2 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-500">Features</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stay organized and on track</h2>
        <p className="text-gray-500 mb-6 text-center max-w-lg">Secure uploads, fast file sorting, and seamless collaboration. Organize content and stay connected in real time.</p>
        <div className="mt-10 w-full flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-700 text-lg font-bold">[Feature Screenshot]</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-700 text-lg font-bold">[Feature Screenshot]</span>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Sharing Section */}
      <section className="w-full flex flex-col items-center py-20 bg-white">
        <span className="mb-2 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-500">Collaboration</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Instant sharing keeps work flowing</h2>
        <p className="text-gray-500 mb-6 text-center max-w-lg">Secure links, fast file sorting, and seamless collaboration. Organize content and stay connected in real time.</p>
        <div className="mt-10 w-full flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-700 text-lg font-bold">[Sharing Screenshot]</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-700 text-lg font-bold">[Sharing Screenshot]</span>
            </div>
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <Link href="/login" className="px-6 py-2 rounded-lg bg-blue-600 text-white text-md font-semibold shadow hover:bg-blue-700 transition">Learn more</Link>
          <Link href="/login" className="px-6 py-2 rounded-lg bg-gray-100 text-blue-700 text-md font-semibold shadow hover:bg-gray-200 transition">Get started free</Link>
        </div>
      </section>

      {/* Security Section (Dark) */}
      <section className="w-full flex flex-col items-center py-20 bg-gray-900 text-white">
        <span className="mb-2 px-3 py-1 rounded-full bg-gray-800 text-xs text-gray-300">Security</span>
        <h2 className="text-2xl font-bold mb-2">Security never comes second</h2>
        <p className="text-gray-300 mb-6 text-center max-w-lg">Files are encrypted before upload and stored securely. Only you and your team can decrypt. Privacy-first architecture for peace of mind.</p>
        <div className="mt-10 w-full flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-200 text-lg font-bold">[Security Screenshot]</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-200 text-lg font-bold">[Security Screenshot]</span>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
            <span className="text-white font-semibold mb-2">The security of knowing us</span>
            <span className="text-gray-400 text-sm">Watch testimonial</span>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
            <span className="text-white font-semibold mb-2">Seriously impressive security</span>
            <span className="text-gray-400 text-sm">Watch testimonial</span>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
            <span className="text-white font-semibold mb-2">Privacy-first architecture</span>
            <span className="text-gray-400 text-sm">Watch testimonial</span>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-8 justify-center items-center w-full max-w-4xl">
          <span className="text-gray-400 text-xs">Figma</span>
          <span className="text-gray-400 text-xs">greenhouse</span>
          <span className="text-gray-400 text-xs">Stripe</span>
          <span className="text-gray-400 text-xs">Jami</span>
          <span className="text-gray-400 text-xs">Mary Kay</span>
          <span className="text-gray-400 text-xs">Sundance Film Festival</span>
        </div>
      </section>

      {/* Industry Empowerment Section */}
      <section className="w-full flex flex-col items-center py-20 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">FileTransfer empowers across industries</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">Construction</span>
            <span className="text-gray-500 text-sm">Learn more</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">Media</span>
            <span className="text-gray-500 text-sm">Learn more</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">Technology</span>
            <span className="text-gray-500 text-sm">Learn more</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">Professional services</span>
            <span className="text-gray-500 text-sm">Learn more</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">Manufacturing</span>
            <span className="text-gray-500 text-sm">Learn more</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">Education</span>
            <span className="text-gray-500 text-sm">Learn more</span>
          </div>
        </div>
      </section>

      {/* Discover, Learn, Thrive Section */}
      <section className="w-full flex flex-col items-center py-20 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Discover, learn, thrive with FileTransfer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">How teams save hours with FileTransfer</span>
            <span className="text-gray-500 text-sm">Read article</span>
          </div>
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">FileTransfer teams up with the F1 team</span>
            <span className="text-gray-500 text-sm">Read article</span>
          </div>
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <span className="font-semibold mb-2">The best way to share photos and files</span>
            <span className="text-gray-500 text-sm">Read article</span>
          </div>
        </div>
        <Link href="#" className="mt-6 text-blue-700 underline">View more resources</Link>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white py-12 mt-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-6 gap-8 text-xs text-gray-500">
          <div>
            <h3 className="font-bold mb-2 text-gray-700">Dropbox</h3>
            <ul>
              <li>Home</li>
              <li>Why FileTransfer</li>
              <li>Features</li>
              <li>Pricing</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-gray-700">Products</h3>
            <ul>
              <li>FileTransfer</li>
              <li>Teams</li>
              <li>Galleries</li>
              <li>Storage</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-gray-700">Features</h3>
            <ul>
              <li>Encryption</li>
              <li>Collaboration</li>
              <li>Comments</li>
              <li>Metadata</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-gray-700">Support</h3>
            <ul>
              <li>Help Center</li>
              <li>Contact</li>
              <li>API Docs</li>
              <li>Learning resources</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-gray-700">Resources</h3>
            <ul>
              <li>Blog</li>
              <li>Security</li>
              <li>Guides</li>
              <li>Partners</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-gray-700">Company</h3>
            <ul>
              <li>About</li>
              <li>Careers</li>
              <li>Legal</li>
              <li>Privacy</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-gray-400 text-sm">© 2025 FileTransfer. All rights reserved.</div>
      </footer>
    </main>
  );
}
