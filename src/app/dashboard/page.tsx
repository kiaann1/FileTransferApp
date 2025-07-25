"use client";
import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
type Gallery = { id: string; name: string; code: string; password?: string; owner_id: string };
type GalleryCardProps = {
  gallery: Gallery;
  onDelete: (id: string) => void;
  onAddUsers: (gallery: Gallery) => void;
  onResetPassword: (gallery: Gallery) => void;
  userId: string | null;
};

function GalleryCard({ gallery, onDelete, onAddUsers, onResetPassword, userId }: GalleryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Detect mobile device
  const isMobile = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const isOwner = gallery && gallery.owner_id === userId;
  return (
    <div
      className="relative bg-white rounded-xl shadow p-6 hover:shadow-lg border border-gray-200 transition cursor-pointer"
      onClick={() => {
        if (isMobile) setMenuOpen(true);
      }}
      onContextMenu={e => {
        e.preventDefault();
        if (!isMobile) setMenuOpen((v) => !v);
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open menu for ${gallery.name}`}
    >
      <a
        href={`/dashboard/gallery/${gallery.code}`}
        className="block"
      >
        <div className="font-bold text-lg text-gray-900 mb-2">{gallery.name}</div>
        <div className="text-gray-500 text-sm">Code: {gallery.code}</div>
      </a>
      <button
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        onClick={e => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        aria-label="Gallery Settings"
      >
        {/* Better Cog SVG */}
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#6B7280" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.43-4.07l-1.43-.23a7.02 7.02 0 0 0-.51-1.23l.86-1.16a.5.5 0 0 0-.06-.66l-1.13-1.13a.5.5 0 0 0-.66-.06l-1.16.86a7.02 7.02 0 0 0-1.23-.51l-.23-1.43A.5.5 0 0 0 15 4h-2a.5.5 0 0 0-.5.43l-.23 1.43a7.02 7.02 0 0 0-1.23.51l-1.16-.86a.5.5 0 0 0-.66.06l-1.13 1.13a.5.5 0 0 0-.06.66l.86 1.16a7.02 7.02 0 0 0-.51 1.23l-1.43.23A.5.5 0 0 0 4 9v2c0 .25.18.46.43.5l1.43.23c.12.43.29.84.51 1.23l-.86 1.16a.5.5 0 0 0 .06.66l1.13 1.13a.5.5 0 0 0 .66.06l1.16-.86c.39.22.8.39 1.23.51l.23 1.43c.04.25.25.43.5.43h2c.25 0 .46-.18.5-.43l.23-1.43c.43-.12.84-.29 1.23-.51l1.16.86a.5.5 0 0 0 .66-.06l1.13-1.13a.5.5 0 0 0 .06-.66l-.86-1.16c.22-.39.39-.8.51-1.23l1.43-.23A.5.5 0 0 0 20 13v-2c0-.25-.18-.46-.43-.5z"/></svg>
      </button>
      {menuOpen && (
        <div ref={menuRef} className="absolute top-12 right-4 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <ul className="py-2">
            <li>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700" onClick={() => { setMenuOpen(false); onAddUsers(gallery); }}>Add Users</button>
            </li>
            {isOwner && (
              <>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700" onClick={() => { setMenuOpen(false); onResetPassword(gallery); }}>Reset Password</button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={() => { setMenuOpen(false); onDelete(gallery.id); }}>Delete Gallery</button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const [galleryName, setGalleryName] = useState("");
  const [galleryPassword, setGalleryPassword] = useState("");
  const [galleryInvites, setGalleryInvites] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinNeedsPassword, setJoinNeedsPassword] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [addUsersModal, setAddUsersModal] = useState<{ open: boolean; gallery: Gallery | null }>({ open: false, gallery: null });
  const [resetPasswordModal, setResetPasswordModal] = useState<{ open: boolean; gallery: Gallery | null }>({ open: false, gallery: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; gallery: Gallery | null }>({ open: false, gallery: null });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [resetPasswordFields, setResetPasswordFields] = useState({ current: "", new: "", confirm: "" });

  // Add notification state
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);

  useEffect(() => {
    async function checkSession() {
      // Check for JWT session cookie
      const cookies = document.cookie.split(';').map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith('session='));
      if (!sessionCookie) {
        router.replace("/login");
        return;
      }
      // Optionally decode JWT for user info (client-side, not secure, but for demo)
      try {
        const token = sessionCookie.split('=')[1];
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.id,
          email: payload.email,
          user_metadata: { username: payload.username },
          app_metadata: {},
          aud: "authenticated",
          created_at: "",
        });
        // If on login page, redirect to dashboard
        if (window.location.pathname === "/login") {
          router.replace("/dashboard");
        }
      } catch {
        router.replace("/login");
        return;
      }
      setLoading(false);
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    // Fetch galleries where user is a member
    (async () => {
      const { data, error } = await supabase
        .from("gallery_members")
        .select("gallery_id, galleries (id, name, code, owner_id)")
        .eq("user_id", user.id);
       if (!error && data) {
         // Flatten and filter out null galleries
         const allGalleries: Gallery[] = data
           .map((row: { galleries: Gallery[] }) => row.galleries)
           .flat()
           .filter((g: Gallery | null): g is Gallery => g !== null);
         setGalleries(allGalleries);
      }
    })();
  }, [user]);

  // Helper to fetch notifications (simulate for now)
  useEffect(() => {
    if (!user) return;
    // Example: fetch notifications from Supabase (replace with your table/logic)
    (async () => {
      const { data } = await supabase
        .from("gallery_notifications")
        .select("id, message")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
    })();
  }, [user]);

  // Listen for new user joins (simulate real-time with polling or Supabase Realtime)
  useEffect(() => {
    // Example: poll every 30s for new notifications
    const interval = setInterval(async () => {
      if (!user) return;
      const { data } = await supabase
        .from("gallery_notifications")
        .select("id, message")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <div className="p-8">Loading..</div>;
  }

  // TODO: Fetch invites and activity from Supabase
  // TODO: Fetch invites and activity from Supabase
  // const invites = [];
  // const recentActivity = [];

  // Clear notification handler
  const handleClearNotification = async (id: string) => {
    await supabase.from("gallery_notifications").delete().eq("id", id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto py-6 px-2 sm:px-4 md:px-6 lg:px-6">
        {/* Welcome header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to your Dashboard</h1>
            {user && (
              <div className="text-gray-800">Signed in as <span className="font-semibold text-gray-900">{user.email}</span></div>
            )}
          </div>
          <div className="flex gap-4 items-center">
            {/* Notification bell for team invites */}
            <div className="relative">
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition focus:outline-none" aria-label="Team Invites">
                {/* Bell SVG */}
                <svg width="28" height="28" fill="none" viewBox="0 0 28 28"><path d="M14 25c1.657 0 3-1.343 3-3h-6c0 1.657 1.343 3 3 3zm7-7V12c0-3.314-2.686-6-6-6S9 8.686 9 12v6l-2 2v1h16v-1l-2-2z" fill="#2563EB"/></svg>
                {/* Notification badge if notifications exist */}
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
                )}
              </button>
              {/* Notifications panel */}
              {notifications.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4 font-bold text-gray-900 border-b">Notifications</div>
                  <ul className="max-h-64 overflow-y-auto">
                    {notifications.map(n => (
                      <li key={n.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                        <span className="text-gray-700">{n.message}</span>
                        <button className="ml-2 text-gray-400 hover:text-red-600 text-lg font-bold" onClick={() => handleClearNotification(n.id)} aria-label="Clear notification">×</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Logout button */}
            <button
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        {/* Gallery list with create button */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Galleries</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                onClick={() => setShowModal(true)}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="9" y="4" width="2" height="12" rx="1" fill="white"/><rect x="4" y="9" width="12" height="2" rx="1" fill="white"/></svg>
                Create Gallery
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
                onClick={() => setShowJoinModal(true)}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="9" y="4" width="2" height="12" rx="1" fill="white"/><rect x="4" y="9" width="12" height="2" rx="1" fill="white"/></svg>
                Join with Code
              </button>
            </div>
          </div>
        {/* Join with Code Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => { setShowJoinModal(false); setJoinCode(""); setJoinError(""); setJoinPassword(""); setJoinNeedsPassword(false); }}>
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl" onClick={() => { setShowJoinModal(false); setJoinCode(""); setJoinError(""); setJoinPassword(""); setJoinNeedsPassword(false); }} aria-label="Close">&times;</button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Gallery by Code</h2>
              <form onSubmit={async e => {
                e.preventDefault();
                setJoinError("");
                if (!joinCode.trim() || !user?.id) {
                  setJoinError("Please enter a valid code.");
                  return;
                }
                // Check if gallery exists and if it needs a password
                const { data: galleryData, error } = await supabase
                  .from("galleries")
                  .select("id, code, password")
                  .eq("code", joinCode.trim())
                  .single();
                if (error || !galleryData) {
                  setJoinError("Gallery not found.");
                  return;
                }
                if (galleryData.password) {
                  // If password required, check it
                  if (!joinPassword) {
                    setJoinNeedsPassword(true);
                    setJoinError("This gallery requires a password.");
                    return;
                  }
                  if (galleryData.password !== joinPassword) {
                    setJoinNeedsPassword(true);
                    setJoinError("Incorrect password.");
                    return;
                  }
                }
                // Add user to gallery_members
                await supabase.from("gallery_members").insert({
                  gallery_id: galleryData.id,
                  user_id: user.id,
                });
                setShowJoinModal(false);
                setJoinCode("");
                setJoinError("");
                setJoinPassword("");
                setJoinNeedsPassword(false);
                router.push(`/dashboard/gallery/${galleryData.code}`);
              }} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">Gallery Code</span>
                  <input type="text" value={joinCode} onChange={async e => {
                    setJoinCode(e.target.value);
                    setJoinError("");
                    setJoinNeedsPassword(false);
                    setJoinPassword("");
                    // Check if gallery needs password as user types
                    if (e.target.value.trim()) {
                      const { data: galleryData } = await supabase
                        .from("galleries")
                        .select("password")
                        .eq("code", e.target.value.trim())
                        .single();
                      setJoinNeedsPassword(!!(galleryData && galleryData.password));
                    }
                  }} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-black" placeholder="Enter gallery code" autoFocus />
                </label>
                {joinNeedsPassword && (
                  <label className="flex flex-col gap-1">
                    <span className="font-medium text-gray-800">Gallery Password</span>
                    <input type="password" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-black" placeholder="Enter gallery password" />
                  </label>
                )}
                {joinError && <div className="text-red-600 text-sm">{joinError}</div>}
                <button type="submit" className="mt-4 px-6 py-3 rounded-xl bg-green-600 text-white text-lg font-semibold shadow hover:bg-green-700 transition">Join Gallery</button>
              </form>
            </div>
          </div>
        )}
          {galleries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-gray-500 mb-4">No galleries yet.</span>
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition"
                onClick={() => setShowModal(true)}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="11" y="5" width="2" height="14" rx="1" fill="white"/><rect x="5" y="11" width="14" height="2" rx="1" fill="white"/></svg>
                New Gallery
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {galleries.map(gallery => (
                <GalleryCard
                  key={gallery.id}
                  gallery={gallery}
                  onDelete={(id) => {
                    const galleryObj = galleries.find(g => g.id === id) || null;
                    setDeleteModal({ open: true, gallery: galleryObj });
                  }}
                  onAddUsers={(gallery) => setAddUsersModal({ open: true, gallery })}
                  onResetPassword={(gallery) => setResetPasswordModal({ open: true, gallery })}
                  userId={user?.id ?? null}
                />
              ))}
            </div>
          )}
        </section>
        {/* Delete Gallery Modal */}
        {deleteModal.open && deleteModal.gallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => { setDeleteModal({ open: false, gallery: null }); setDeleteConfirmText(""); }}>
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl" onClick={() => { setDeleteModal({ open: false, gallery: null }); setDeleteConfirmText(""); }} aria-label="Close">&times;</button>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Gallery</h2>
              <div className="mb-4 text-gray-700">
                <strong>Warning:</strong> This will permanently delete <span className="font-bold">{deleteModal.gallery.name}</span> and <span className="font-bold">all files, users, and contents</span> associated with it. This action cannot be undone.<br />
                To confirm, type <span className="font-bold text-red-600">DELETE</span> below.
              </div>
              <form onSubmit={async e => {
                e.preventDefault();
                if (deleteConfirmText !== "DELETE") return;
                if (!deleteModal.gallery) return;
                const id = deleteModal.gallery.id;
                await supabase.from("gallery_files").delete().eq("gallery_id", id);
                await supabase.from("gallery_invites").delete().eq("gallery_id", id);
                await supabase.from("gallery_members").delete().eq("gallery_id", id);
                await supabase.from("galleries").delete().eq("id", id);
                setGalleries(galleries.filter(g => g.id !== id));
                setDeleteModal({ open: false, gallery: null });
                setDeleteConfirmText("");
              }} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">Type <span className="text-red-600 font-bold">DELETE</span> to confirm</span>
                  <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black" placeholder="DELETE" />
                </label>
                <button type="submit" disabled={deleteConfirmText !== "DELETE"} className={`mt-4 px-6 py-3 rounded-xl bg-red-600 text-white text-lg font-semibold shadow hover:bg-red-700 transition ${deleteConfirmText !== "DELETE" ? "opacity-50 cursor-not-allowed" : ""}`}>Delete Gallery</button>
              </form>
            </div>
          </div>
        )}
        {/* Add Users Modal */}
        {addUsersModal.open && addUsersModal.gallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setAddUsersModal({ open: false, gallery: null })}>
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl" onClick={() => setAddUsersModal({ open: false, gallery: null })} aria-label="Close">&times;</button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite Users to {addUsersModal.gallery.name}</h2>
              <form onSubmit={async e => {
                e.preventDefault();
                const emails = inviteEmails.split(",").map(email => email.trim()).filter(email => email.length > 0);
                if (emails.length > 0) {
                  await supabase.from("gallery_invites").insert(
                    emails.map(email => ({
                      gallery_id: addUsersModal.gallery?.id,
                      email,
                      invited_by: user?.id,
                    }))
                  );
                }
                setInviteEmails("");
                setAddUsersModal({ open: false, gallery: null });
              }} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">Invite Emails <span className="text-gray-400">(comma separated)</span></span>
                  <input type="text" value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="user1@email.com, user2@email.com" />
                </label>
                <button type="submit" className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">Send Invites</button>
              </form>
            </div>
          </div>
        )}
        {/* Reset Password Modal */}
        {resetPasswordModal.open && resetPasswordModal.gallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setResetPasswordModal({ open: false, gallery: null })}>
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl" onClick={() => setResetPasswordModal({ open: false, gallery: null })} aria-label="Close">&times;</button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reset Password for {resetPasswordModal.gallery.name}</h2>
              <form onSubmit={async e => {
                e.preventDefault();
                if (!resetPasswordFields.current || !resetPasswordFields.new || !resetPasswordFields.confirm) return;
                if (resetPasswordFields.new !== resetPasswordFields.confirm) {
                  await Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "New passwords do not match."
                  });
                  return;
                }
                // Check current password
                if (!resetPasswordModal.gallery) return;
                const { data: galleryData } = await supabase.from("galleries").select("password").eq("id", resetPasswordModal.gallery.id).single();
                if (!galleryData || galleryData.password !== resetPasswordFields.current) {
                  await Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Current password is incorrect."
                  });
                  return;
                }
                // Update password
                await supabase.from("galleries").update({ password: resetPasswordFields.new }).eq("id", resetPasswordModal.gallery.id);
                setResetPasswordFields({ current: "", new: "", confirm: "" });
                setResetPasswordModal({ open: false, gallery: null });
                await Swal.fire({
                  icon: "success",
                  title: "Password updated",
                  text: "The password has been updated successfully."
                });
              }} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">Current Password</span>
                  <input type="password" value={resetPasswordFields.current} onChange={e => setResetPasswordFields(f => ({ ...f, current: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Current password" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">New Password</span>
                  <input type="password" value={resetPasswordFields.new} onChange={e => setResetPasswordFields(f => ({ ...f, new: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="New password" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">Confirm New Password</span>
                  <input type="password" value={resetPasswordFields.confirm} onChange={e => setResetPasswordFields(f => ({ ...f, confirm: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Confirm new password" />
                </label>
                <button type="submit" className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">Update Password</button>
              </form>
            </div>
          </div>
        )}
        {/* Gallery Creation Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Gallery</h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!galleryName.trim() || !user?.id) return;
                  // Helper to generate a random 6-character code
                  function generateCode(length = 6) {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    let code = '';
                    for (let i = 0; i < length; i++) {
                      code += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    return code;
                  }
                  try {
                    // 1. Generate a unique code (retry if collision)
                    let code = '';
                    let codeExists = true;
                    for (let attempts = 0; attempts < 5 && codeExists; attempts++) {
                      code = generateCode();
                      const { data: existing } = await supabase
                        .from("galleries")
                        .select("id")
                        .eq("code", code);
                      codeExists = !!(existing && existing.length > 0);
                    }
                    if (codeExists || !code) throw new Error("Could not generate unique code");
                    // 2. Create gallery with code
                    const { data: galleryData, error: galleryError } = await supabase
                      .from("galleries")
                      .insert([
                        {
                          name: galleryName,
                          password: galleryPassword || null,
                          owner_id: user.id,
                          code: code,
                        },
                      ])
                      .select();
                    if (galleryError) throw galleryError;
                    const newGallery = Array.isArray(galleryData) ? galleryData[0] : galleryData;
                    if (!newGallery || !newGallery.code) throw new Error("Gallery creation failed");
                    // 3. Add creator to gallery_members
                    await supabase.from("gallery_members").insert([
                      {
                        gallery_id: newGallery.id,
                        user_id: user.id,
                      },
                    ]);
                    // 4. Add invites
                    const inviteEmails = galleryInvites
                      .split(",")
                      .map(email => email.trim())
                      .filter(email => email.length > 0);
                    if (inviteEmails.length > 0) {
                      await supabase.from("gallery_invites").insert(
                        inviteEmails.map(email => ({
                          gallery_id: newGallery.id,
                          email,
                          invited_by: user.id,
                        }))
                      );
                    }
                    // 5. Reset modal and redirect using code
                    setShowModal(false);
                    setGalleryName("");
                    setGalleryPassword("");
                    setGalleryInvites("");
                    router.push(`/dashboard/gallery/${newGallery.code}`);
                  } catch (err) {
                  await Swal.fire({
                    icon: "error",
                    title: "Failed to create gallery",
                    text: err instanceof Error ? err.message : "Unknown error"
                  });
                  }
                }}
                className="flex flex-col gap-4"
              >
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">Gallery Name</span>
                  <input
                    type="text"
                    required
                    value={galleryName}
                    onChange={e => setGalleryName(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Enter gallery name"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">Password <span className="text-gray-400">(optional)</span></span>
                  <input
                    type="password"
                    value={galleryPassword}
                    onChange={e => setGalleryPassword(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Set a password (optional)"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium text-gray-800">Invite Team Members <span className="text-gray-400">(comma separated emails)</span></span>
                  <input
                    type="text"
                    value={galleryInvites}
                    onChange={e => setGalleryInvites(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="user1@email.com, user2@email.com"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition"
                >
                  Create Gallery
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
