"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Removed public gallery list for privacy
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [dark]);

  // Removed fetching of all galleries for privacy

  // SVG ICON
  const DarkIcon = ({dark}:{dark:boolean}) => dark
    ? (<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 7.05l-.71-.71M4.05 4.05l-.71-.71" /><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2} /></svg>)
    : (<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>);

  const handleCreate = async () => {
    let requirePassword = false;
    let password = "";
    const { value: toggle } = await Swal.fire({
      title: 'Require a password for your gallery?',
      input: 'checkbox',
      inputValue: 0,
      inputPlaceholder: 'Require password',
      confirmButtonText: 'Next',
      showCancelButton: true,
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
      inputValidator: () => {}
    });
    if (toggle === undefined) return;
    requirePassword = !!toggle;
    if (requirePassword) {
      const { value: pw } = await Swal.fire({
        title: 'Set a password for your gallery',
        input: 'password',
        inputLabel: 'Password (min 4 chars)',
        inputPlaceholder: 'Enter password',
        inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
        showCancelButton: true,
        confirmButtonText: 'Create',
        background: document.body.classList.contains('dark') ? '#232946' : '#fff',
        color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
        inputValidator: (value) => {
          if (!value || value.length < 4) return 'Password must be at least 4 characters';
        }
      });
      if (pw === undefined) return;
      password = pw;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.code) {
        router.push(`/gallery/${data.code}`);
      } else {
        setError(data.error || "Failed to create gallery.");
      }
    } catch {
      setError("Failed to create gallery.");
    } finally {
      setLoading(false);
    }
  };

  // Delete gallery handler removed (no public gallery list)

  // Join with gallery code, only prompt for password if required
  const handleJoin = async () => {
    const { value: code } = await Swal.fire({
      title: 'Join Gallery',
      input: 'text',
      inputLabel: 'Enter 6-digit gallery code',
      inputPlaceholder: 'e.g. 123456',
      showCancelButton: true,
      confirmButtonText: 'Next',
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
      inputValidator: (value) => {
        if (!/^[0-9]{6}$/.test(value)) return 'Please enter a valid 6-digit code';
      }
    });
    if (!code) return;
    // Check if gallery requires a password
    let requiresPassword = false;
    try {
      const res = await fetch(`/api/gallery/${code}`);
      if (res.ok) {
        const data = await res.json();
        requiresPassword = !!data.requiresPassword;
      } else {
        await Swal.fire({
          title: 'Not found',
          text: 'Gallery not found.',
          icon: 'error',
          background: document.body.classList.contains('dark') ? '#232946' : '#fff',
          color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
        });
        return;
      }
    } catch {
      await Swal.fire({
        title: 'Error',
        text: 'Failed to check gallery.',
        icon: 'error',
        background: document.body.classList.contains('dark') ? '#232946' : '#fff',
        color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
      });
      return;
    }
    let password = "";
    if (requiresPassword) {
      const { value: pw } = await Swal.fire({
        title: 'Enter Gallery Password',
        input: 'password',
        inputLabel: 'Password',
        inputPlaceholder: 'Enter the gallery password',
        showCancelButton: true,
        confirmButtonText: 'Join',
        background: document.body.classList.contains('dark') ? '#232946' : '#fff',
        color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
        inputValidator: (value) => {
          if (!value) return 'Password required';
        }
      });
      if (!pw) return;
      password = pw;
    }
    const res = await fetch(`/api/gallery/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      router.push(`/gallery/${code}`);
    } else {
      const data = await res.json();
      await Swal.fire({
        title: 'Access denied',
        text: data.error || 'Invalid code or password.',
        icon: 'error',
        background: document.body.classList.contains('dark') ? '#232946' : '#fff',
        color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <button
        aria-label="Toggle dark mode"
        onClick={() => setDark(d => !d)}
        style={{position:'fixed',top:18,right:24,zIndex:1200,background:dark?'#232946':'#fff',color:dark?'#e0e7ff':'#6366f1',border:'1.5px solid #6366f1',borderRadius:'50%',width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',cursor:'pointer',boxShadow:'0 2px 8px rgba(99,102,241,0.08)',transition:'background 0.2s, color 0.2s'}}
        title="Toggle dark mode"
      >
        <DarkIcon dark={dark} />
      </button>
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 w-full max-w-md text-zinc-900">
        <h1 className="text-3xl font-bold text-center mb-2">
          Collaborative Image Library
        </h1>
        <p className="text-zinc-700 text-center mb-4">
          Create a shared image gallery with a unique 6-digit code. Upload, share,
          and collaborate instantly.
        </p>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-60 w-full"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Library"}
        </button>
        <button
          className="bg-zinc-200 hover:bg-zinc-300 text-indigo-700 font-semibold px-6 py-3 rounded-lg transition w-full"
          onClick={handleJoin}
        >
          Join with Gallery Code
        </button>
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
        {/* Gallery list removed for privacy. Only show create/join options. */}
      </div>
      <footer className="mt-10 text-zinc-400 text-xs">
        &copy; {new Date().getFullYear()} Collaborative Image Library
      </footer>
    </div>
  );
}
