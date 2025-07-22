"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [galleries, setGalleries] = useState<{ code: string; createdAt: string }[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    setFetching(true);
    fetch("/api/gallery")
      .then((res) => res.json())
      .then(setGalleries)
      .catch(() => setError("Failed to fetch galleries."))
      .finally(() => setFetching(false));
  }, []);

  const handleCreate = async () => {
    const { value: password } = await Swal.fire({
      title: 'Set a password for your gallery',
      input: 'password',
      inputLabel: 'Password (min 4 chars)',
      inputPlaceholder: 'Enter a password',
      inputAttributes: { minlength: "4", autocapitalize: 'off', autocorrect: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Create',
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
      inputValidator: (value) => {
        if (!value || value.length < 4) return 'Password must be at least 4 characters';
      }
    });
    if (!password) return;
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

  // Delete gallery handler
  const handleDeleteGallery = async (code: string) => {
    const result = await Swal.fire({
      title: 'Delete this gallery?',
      html: 'This will <b>permanently delete</b> the gallery, all images, and all users with this code.<br><br>Type <b>DELETE</b> to confirm.',
      input: 'text',
      inputPlaceholder: 'Type DELETE',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
      preConfirm: (input) => {
        if (input !== 'DELETE') {
          Swal.showValidationMessage('You must type DELETE to confirm.');
        }
        return input;
      }
    });
    if (result.isConfirmed && result.value === 'DELETE') {
      const res = await fetch(`/api/gallery/${code}`, { method: 'DELETE' });
      if (res.ok) {
        setGalleries(galleries => galleries.filter(g => g.code !== code));
        await Swal.fire({
          title: 'Deleted!',
          text: 'The gallery and all its data have been deleted.',
          icon: 'success',
          timer: 1400,
          showConfirmButton: false,
          background: document.body.classList.contains('dark') ? '#232946' : '#fff',
          color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
        });
      } else {
        await Swal.fire({
          title: 'Error',
          text: 'Failed to delete gallery.',
          icon: 'error',
          background: document.body.classList.contains('dark') ? '#232946' : '#fff',
          color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
        });
      }
    }
  };

  // Join with gallery code and password
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
    const { value: password } = await Swal.fire({
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
    if (!password) return;
    const res = await fetch(`/api/gallery/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      // TODO: Add user to gallery user list (future)
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-zinc-900 dark:to-zinc-800">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">
          Collaborative Image Library
        </h1>
        <p className="text-zinc-600 dark:text-zinc-300 text-center mb-4">
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
          className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-indigo-700 dark:text-indigo-300 font-semibold px-6 py-3 rounded-lg transition w-full"
          onClick={handleJoin}
        >
          Join with Gallery Code
        </button>
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
        <div className="w-full mt-6">
          <h2 className="text-lg font-semibold mb-2">Existing Galleries</h2>
          {fetching ? (
            <div className="text-zinc-400 text-sm">Loading galleries...</div>
          ) : galleries.length === 0 ? (
            <div className="text-zinc-400 text-sm">No galleries found.</div>
          ) : (
            <ul className="space-y-2">
              {galleries.map((g) => (
                <li key={g.code} className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 rounded px-3 py-2">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{g.code}</span>
                  <div className="flex gap-2">
                    <button
                      className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded px-3 py-1"
                      onClick={() => router.push(`/gallery/${g.code}`)}
                    >
                      Open
                    </button>
                    <button
                      className="text-sm bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1"
                      onClick={() => handleDeleteGallery(g.code)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <footer className="mt-10 text-zinc-400 text-xs">
        &copy; {new Date().getFullYear()} Collaborative Image Library
      </footer>
    </div>
  );
}
