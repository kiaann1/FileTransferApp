"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import type { User } from '@supabase/supabase-js';
import { ToastContainer, toast, ToastContent } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import Image from "next/image";


function ImageClickOverlay({ file, handleOpenModal, toast }: ImageClickOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  return (
    <div className="relative w-40 h-40">
      <Image
        src={file.url}
        alt={file.name}
        width={160}
        height={160}
        className={`w-40 h-40 object-cover rounded transition-opacity duration-200 ${showOverlay ? 'opacity-60' : ''}`}
        onClick={async (e) => {
          e.stopPropagation();
          setShowOverlay(true);
          if (window.matchMedia('(pointer: coarse)').matches) {
            handleOpenModal(file);
            return;
          }
          try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            if (navigator.clipboard && window.ClipboardItem) {
              await navigator.clipboard.write([
                new window.ClipboardItem({ [blob.type]: blob })
              ]);
              toast('Image copied to clipboard!', { type: 'success' });
            } else if (navigator.clipboard) {
              await navigator.clipboard.writeText(file.url);
              toast('Image URL copied!', { type: 'success' });
            } else {
              handleOpenModal(file);
            }
          } catch {
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(file.url);
              toast('Image URL copied!', { type: 'success' });
            } else {
              handleOpenModal(file);
            }
          }
          setTimeout(() => setShowOverlay(false), 800);
        }}
      />
      <button
        type="button"
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 bg-transparent ${showOverlay ? 'opacity-100' : 'opacity-0'}`}
        title="Copy image"
        tabIndex={-1}
        style={{ pointerEvents: 'none' }}
      >
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="3" fill="#fff" fillOpacity="0.8" />
          <path d="M9 9h6v6H9z" stroke="#6c63ff" strokeWidth="2" fill="none" />
          <path d="M12 12v3" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 12h3" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

type GalleryFile = {
  id: string;
  name: string;
  url: string;
  size?: number;
  type: string;
  last_modified?: string | Date;
  uploader_email?: string;
  uploader_username?: string;
  uploaded_at?: string;
  // add other fields as needed
};

type ImageClickOverlayProps = {
  file: GalleryFile;
  handleOpenModal: (file: GalleryFile) => void;
  toast: (content: import("react-toastify").ToastContent, options?: object) => void;
};

export default function GalleryPage() {
  // Mobile menu state (must be inside component)
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // Rename gallery state
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState("");
  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsError, setSettingsError] = useState("");
  // Multi-select state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  // Password modal state
  // Removed unused passwordInput and passwordError
  // Router and params
  const router = useRouter();
  const { code } = useParams();
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  // Gallery state
  type Gallery = {
    id: string;
    name: string;
    code: string;
    password?: string;
    // add other fields as needed
  };
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Check authentication client-side
  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/login");
      } else {
        setUser(data.user);
      }
    }
    checkAuth();
  }, [router]);
  // Drop ref
  const dropRef = useRef<HTMLDivElement>(null);
  // Context menu and modal state
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; file: GalleryFile | null }>({ visible: false, x: 0, y: 0, file: null });
  const [modalFile, setModalFile] = useState<GalleryFile | null>(null);
  // New Folder modal state (removed unused showNewFolderModal, newFolderName, newFolderError)
  // Rename gallery state (already declared above)

  // Open modal handler
  // Open modal for file preview and metadata
  async function handleOpenModal(file: GalleryFile) {
    setModalFile(file);
    setContextMenu({ ...contextMenu, visible: false });
  }

  // Copy file/image URL to clipboard
  // Removed unused handleCopyUrl

  // Download file
  function handleDownloadFile(file: GalleryFile) {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Bulk select
  function handleSelectFile(fileId: string) {
    setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    setContextMenu({ ...contextMenu, visible: false });
  }

  // Context menu open
  function handleContextMenu(e: React.MouseEvent, file: GalleryFile) {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, file });
  }

  async function handleDeleteFile(file: GalleryFile | null) {
    if (!file) return;
    if (!window.confirm(`Delete ${file.name}? This cannot be undone.`)) {
      toast('Delete cancelled.', { type: 'info' });
      return;
    }
    // Extract file path from URL (adjust if your URL format is different)
    const urlParts = file.url?.split('/');
    const filePath = urlParts.slice(urlParts.length - 2).join('/');
    await supabase.storage.from('gallery-files').remove([filePath]);
    await supabase.from('gallery_files').delete().eq('id', file.id);
    toast('File deleted.', { type: 'success' });
    if (gallery) {
      fetchFiles(gallery.id);
    }
  }

  const handleFileUpload = useCallback(async (filesList: File[] | FileList) => {
    if (!gallery) return;
    // Check authentication before uploading
    const userRes = await supabase.auth.getUser();
    if (!userRes || !userRes.data?.user) {
      toast("You must be logged in to upload files.", { type: "error" });
      return;
    }
    const username = userRes.data.user.user_metadata?.username || userRes.data.user.email;
    setUploading(true);
    let uploaded = false;
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const timestamp = Date.now();
      const filePath = `${gallery.code}/${timestamp}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("gallery-files")
        .upload(filePath, file, {
          cacheControl: "3600", 
          upsert: false,
        });
      if (uploadError) {
        toast(`Failed to upload ${file.name}: ${uploadError.message}`, { type: "error" });
        continue;
      }
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("gallery-files")
        .getPublicUrl(filePath);
      // Insert metadata into gallery_files table
      let dbType: 'file' | 'image' | 'folder' = 'file';
      if (file.type && file.type.startsWith('image')) dbType = 'image';
      const { error: dbError } = await supabase.from("gallery_files").insert({
        gallery_id: gallery.id, 
        name: file.name,
        type: dbType,
        url: urlData?.publicUrl || null,
        uploader_email: userRes.data.user.email,
        uploader_username: username,
        uploaded_at: new Date(timestamp).toISOString(),
        size: file.size,
      }).select();
      if (dbError) {
        toast(`Failed to insert ${file.name} into DB: ${dbError.message}`, { type: "error" });
      } else {
        uploaded = true;
        toast(`Uploaded ${file.name}`, { type: "success" });
      }
    }
    setUploading(false);
    // Always fetch files after upload
    if (uploaded && gallery) {
      await fetchFiles(gallery.id);
    }
  }, [gallery]);

  // Drag-and-drop support for dropper
  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;
    function handleDragOver(e: Event) {
      e.preventDefault();
      (dropArea as HTMLDivElement).classList.add("border-[#6c63ff]");
    }
    function handleDragLeave(e: Event) {
      e.preventDefault();
      (dropArea as HTMLDivElement).classList.remove("border-[#6c63ff]");
    }
    function handleDrop(e: Event) {
      e.preventDefault();
      (dropArea as HTMLDivElement).classList.remove("border-[#6c63ff]");
      const files = (e as DragEvent).dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileUpload(files);
      }
    }
    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);
    return () => {
      dropArea.removeEventListener("dragover", handleDragOver);
      dropArea.removeEventListener("dragleave", handleDragLeave);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, [handleFileUpload]);

  // Hide context menu on click elsewhere
  useEffect(() => {
    function handleClick() {
      if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
    }
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

// Fetch files helper
async function fetchFiles(galleryId: string) {
  const { data: filesData, error } = await supabase
    .from("gallery_files")
    .select("*")
    .eq("gallery_id", galleryId);
  if (error) {
    console.error('Error fetching files:', error);
  } 
  setFiles(filesData || []);
}

// Fix infinite loop in gallery and files fetch
useEffect(() => {
  const fetchGallery = async () => {
    const { data: galleryData, error } = await supabase
      .from("galleries")
      .select("id, name, code, password")
      .eq("code", code)
      .single();
    if (error || !galleryData) {
      router.replace("/dashboard");
      return;
    }
    setGallery(galleryData);
    if (galleryData.password) {
      setShowPasswordModal(true);
    }
    setLoading(false);
  };
  if (code && user && router) {
    fetchGallery();
  }
}, [code, user, router]);

useEffect(() => {
  async function fetchIfNeeded() {
    if (gallery && (!gallery.password || !showPasswordModal)) {
      await fetchFiles(gallery.id);
    }
  }
  fetchIfNeeded();
}, [gallery, showPasswordModal]);

  // Removed unused handlePasswordSubmit

  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-xl">Loading gallery...</div>;
  }

  // Sidebar navigation items
  const sidebarNav = [
    { name: "Dashboard", icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#6c63ff"/></svg>, href: "/dashboard" },
    { name: "My Files", icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="3" fill="#b3b3ff"/><rect x="9" y="15" width="6" height="2" rx="1" fill="#6c63ff"/></svg>, href: `/dashboard/gallery/${code}` },
    { name: "Collaborators", icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#b3b3ff"/><rect x="6" y="16" width="12" height="4" rx="2" fill="#6c63ff"/></svg>, href: "/dashboard/collaborators" },
    { name: "Settings", icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e0e7ff"/><rect x="10" y="6" width="4" height="12" rx="2" fill="#6c63ff"/></svg>, href: "/dashboard/settings" },
  ];

  // Sort files by uploaded_at descending
  const sortedFiles = [...files].sort((a, b) => {
    if (a.uploaded_at && b.uploaded_at) {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    }
    return 0;
  });

  // ...existing code...

  // Handle rename submit
  async function handleRenameSubmit() {
    if (!gallery || !renameValue.trim() || gallery.name === renameValue.trim()) {
      setRenaming(false);
      setRenameError("");
      return;
    }
    setRenameLoading(true);
    setRenameError("");
    const { error } = await supabase
      .from("galleries")
      .update({ name: renameValue.trim() })
      .eq("id", gallery.id);
    setRenameLoading(false);
    if (error) {
      setRenameError("Failed to rename gallery.");
      toast("Failed to rename gallery.", { type: "error" });
    } else {
      setGallery({ ...gallery, name: renameValue.trim() });
      setRenaming(false);
      toast("Gallery renamed!", { type: "success" });
    }
  }

  // Topbar with rename
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col md:flex-row">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      {/* Mobile pop-out menu (drawer) */}
      <div className="md:hidden w-full">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e0e7ff]">
          <Image src="/file.svg" alt="Logo" width={40} height={40} className="h-10 w-auto" />
          <button
            className="p-2 rounded-full hover:bg-[#f3f4fe] focus:outline-none"
            aria-label="Open menu"
            onClick={() => setShowMobileMenu(true)}
          >
            {/* Hamburger icon */}
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect y="5" width="24" height="2" rx="1" fill="#6c63ff"/><rect y="11" width="24" height="2" rx="1" fill="#6c63ff"/><rect y="17" width="24" height="2" rx="1" fill="#6c63ff"/></svg>
          </button>
        </div>
        {/* Drawer menu */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex" onClick={() => setShowMobileMenu(false)}>
            <div className="bg-white w-64 h-full shadow-lg flex flex-col p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                <Image src="/file.svg" alt="Logo" width={40} height={40} className="h-10 w-auto" />
                <button className="p-2 rounded-full hover:bg-[#f3f4fe]" aria-label="Close menu" onClick={() => setShowMobileMenu(false)}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
              <nav className="flex flex-col gap-6">
                {sidebarNav.map(item => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f3f4fe] text-gray-900 font-semibold transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-[#e0e7ff] flex-col py-10 px-6 min-h-screen items-start justify-start">
        <div className="mb-10 flex items-center justify-center w-full">
          <Image src="/file.svg" alt="Logo" width={40} height={40} className="h-10 w-auto" />
        </div>
        <nav className="flex flex-col gap-6 w-full justify-start">
          {sidebarNav.map(item => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f3f4fe] text-gray-900 font-semibold transition"
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-2 md:px-12 py-4 md:py-10">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {!renaming ? (
                <>
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{gallery?.name || "Gallery"}</h1>
                  <button
                    className="ml-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                    title="Rename Gallery"
                    onClick={() => {
                      setRenaming(true);
                      setRenameValue(gallery?.name || "");
                    }}
                  >
                    {/* Pen icon */}
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0-2.12-2.12L6 17.88V20z" fill="#6c63ff"/><path d="M14.06 7.94l2 2" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <button
                    className="ml-1 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                    title="Gallery Settings"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    {/* Cog icon */}
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path fill="#6c63ff" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.43-4.07l-1.43-.23a7.02 7.02 0 0 0-.51-1.23l.86-1.16a.5.5 0 0 0-.06-.66l-1.13-1.13a.5.5 0 0 0-.66-.06l-1.16.86a7.02 7.02 0 0 0-1.23-.51l-.23-1.43A.5.5 0 0 0 15 4h-2a.5.5 0 0 0-.5.43l-.23 1.43a7.02 7.02 0 0 0-1.23.51l-1.16-.86a.5.5 0 0 0-.66.06l-1.13 1.13a.5.5 0 0 0-.06.66l.86 1.16a7.02 7.02 0 0 0-.51 1.23l-1.43.23A.5.5 0 0 0 4 9v2c0 .25.18.46.43.5l1.43.23c.12.43.29.84.51 1.23l-.86 1.16a.5.5 0 0 0 .06.66l1.13 1.13a.5.5 0 0 0 .66.06l1.16-.86c.39.22.8.39 1.23.51l.23 1.43c.04.25.25.43.5.43h2c.25 0 .46-.18.5-.43l.23-1.43c.43-.12.84-.29 1.23-.51l1.16.86a.5.5 0 0 0 .66-.06l1.13-1.13a.5.5 0 0 0 .06-.66l-.86-1.16c.22-.39.39-.8.51-1.23l1.43-.23A.5.5 0 0 0 20 13v-2c0-.25-.18-.46-.43-.5z"/></svg>
                  </button>
                </>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleRenameSubmit();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    className="text-4xl font-extrabold text-gray-900 tracking-tight border-b-2 border-[#6c63ff] bg-transparent focus:outline-none px-2"
                    autoFocus
                    disabled={renameLoading}
                  />
                  <button
                    type="submit"
                    className="ml-2 p-2 rounded-full bg-[#6c63ff] text-white hover:bg-[#5548c8] focus:outline-none"
                    disabled={renameLoading}
                    title="Save"
                  >
                    {/* Check icon */}
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </form>
              )}
            </div>
      {/* Settings Modal for password */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl" onClick={() => setShowSettingsModal(false)} aria-label="Close">&times;</button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gallery Settings</h2>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setSettingsError("");
                if (!gallery) return;
                if (!settingsPassword.trim()) {
                  setSettingsError("Password cannot be empty.");
                  return;
                }
                const { error } = await supabase
                  .from("galleries")
                  .update({ password: settingsPassword.trim() })
                  .eq("id", gallery.id);
                if (error) {
                  setSettingsError("Failed to update password.");
                  toast("Failed to update password.", { type: "error" });
                } else {
                  setGallery({ ...gallery, password: settingsPassword.trim() });
                  setShowSettingsModal(false);
                  setSettingsPassword("");
                  toast("Password updated!", { type: "success" });
                }
              }}
              className="flex flex-col gap-4"
            >
              <label className="flex flex-col gap-1">
                <span className="font-medium text-gray-800">Set Gallery Password</span>
                <input
                  type="password"
                  value={settingsPassword}
                  onChange={e => setSettingsPassword(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6c63ff] text-black"
                  placeholder="Enter new password"
                />
              </label>
              {settingsError && <div className="text-red-600 text-sm">{settingsError}</div>}
              <button
                type="submit"
                className="mt-4 px-6 py-3 rounded-xl bg-[#6c63ff] text-white text-lg font-semibold shadow hover:bg-[#5548c8] transition"
              >Save Password</button>
            </form>
          </div>
        </div>
      )}
            {renameError && <div className="text-red-600 text-sm mb-1">{renameError}</div>}
            <div className="text-gray-400 font-medium">All your uploaded files, assets, and documents in one place.</div>
          </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
            <span className="font-mono text-lg bg-[#f3f4fe] px-4 py-2 rounded-lg border border-[#b3b3ff] text-black">{gallery?.code || "-"}</span>
            <button
              className="px-4 py-2 rounded-lg bg-[#6c63ff] text-white font-semibold shadow hover:bg-[#5548c8] transition text-base"
              onClick={() => {
                if (gallery?.code) {
                  navigator.clipboard.writeText(gallery.code);
                  toast("Gallery code copied!", { type: "success" });
                }
              }}
            >Copy</button>
          </div>
        </div>
        {/* Upload box */}
        <div className="mb-6 md:mb-10">
          <div ref={dropRef} className="rounded-2xl border-2 border-[#b3b3ff] bg-white p-6 md:p-10 flex flex-col items-center justify-center text-center shadow-sm" style={{ minHeight: 120 }}>
            <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center w-full">
              <div className="flex items-center gap-6 mb-3">
                <span className="inline-block bg-[#f3f4fe] rounded-full p-4">
                  {/* Custom upload SVG icon */}
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="20" width="20" height="10" rx="5" fill="#b3b3ff"/>
                    <path d="M20 25V13" stroke="#6c63ff" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M15 18l5-5 5 5" stroke="#6c63ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
              <span className="text-xl font-semibold text-[#6c63ff]">Click here to upload your file or drag.</span>
              <span className="text-sm text-gray-400 mt-2">Supported Format: SVG, JPG, PNG, PDF, DOC, HTML, TSX (10mb each)</span>
              <input type="file" multiple className="hidden" id="file-upload-input" onChange={e => { if (e.target.files) handleFileUpload(e.target.files); }} disabled={uploading} />
              {uploading && <span className="mt-2 text-[#6c63ff]">Uploading...</span>}
            </label>
          </div>
        </div>
        {/* Debug output: show raw files, sortedFiles, and gallery object */}
        {/* ...existing code... */}
        {/* File table */}
        <div className="bg-white rounded-2xl shadow p-4 md:p-8 overflow-x-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 md:mb-6">
            <div className="text-xl font-bold text-gray-900">Attached Files <span className="text-xs text-[#6c63ff] font-semibold ml-2">{files.length} Total</span></div>
            <div className="flex gap-3 items-center">
              {/* Search and collaborator UI temporarily hidden for debugging */}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedFiles.length === 0 ? (
              <div className="col-span-4 text-gray-400 text-center py-12 text-lg">No files uploaded yet.</div>
            ) : (
              sortedFiles.map(file => (
                <div
                  key={file.id}
                  className={`bg-[#f3f4fe] rounded-2xl shadow p-4 flex flex-col items-center justify-start relative border transition-all ${selectedFiles.includes(file.id) ? 'border-4 border-[#6c63ff]' : 'border border-[#e0e7ff]'}`}
                  style={selectedFiles.includes(file.id) ? { borderColor: '#6c63ff' } : {}}
                  onContextMenu={e => handleContextMenu(e, file)}
                >
                  <span
                    className="inline-block bg-[#e0e7ff] rounded p-2 cursor-pointer mb-2"
                    title={file.type === 'image' ? 'Tap to copy or hold to open' : 'Right click for options'}
                  >
                    {file.type === 'image' ? (
                      <ImageClickOverlay file={file} handleOpenModal={handleOpenModal} toast={toast} />
                    ) : file.type === 'file' ? (
                      <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="3" fill="#6c63ff"/><rect x="9" y="15" width="6" height="2" rx="1" fill="#b3b3ff"/></svg>
                    ) : file.type === 'folder' ? (
                      <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="8" rx="3" fill="#fbbf24"/></svg>
                    ) : null}
                  </span>
                  <div className="w-full flex flex-col items-center justify-center mb-2">
                    <span className="font-semibold text-gray-900 text-base text-center break-words w-full">{file.name}</span>
                    <span className="text-gray-700 text-sm">{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '--'}</span>
                    <span className="text-gray-700 text-sm">{file.uploader_email || '--'}</span>
                  <span className="text-gray-700 text-sm">{file.uploader_username || file.uploader_email || '--'}</span>
                  </div>
                  <div className="flex gap-4 items-center justify-center w-full mt-2">
                    <button className="text-[#ff4d4f] hover:bg-[#ffeaea] p-2 rounded-full" title="Delete" onClick={() => handleDeleteFile(file)}>
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="#ff4d4f" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                    <button
                      className="text-[#6c63ff] hover:bg-[#e0e7ff] p-2 rounded-full"
                      title="Download"
                      onClick={async e => {
                        e.stopPropagation();
                        try {
                          const response = await fetch(file.url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = file.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch {
                          toast('Failed to download file.', { type: 'error' });
                        }
                      }}
                    >
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                    <button
                      className={`p-2 rounded-full ${selectedFiles.includes(file.id) ? 'bg-[#6c63ff] text-white' : 'bg-gray-100 text-[#6c63ff]'}`}
                      title={selectedFiles.includes(file.id) ? 'Unselect' : 'Select'}
                      onClick={() => handleSelectFile(file.id)}
                    >
                      {selectedFiles.includes(file.id) ? (
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#6c63ff"/><path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                      ) : (
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e0e7ff"/><path d="M7 13l3 3 7-7" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Preview modal (responsive layout) */}
        {modalFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(247, 248, 250, 0.85)' }} onClick={() => setModalFile(null)}>
            <div
              className="bg-white rounded-2xl p-8 shadow-lg relative max-w-3xl w-full flex flex-col md:flex-row"
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 text-xl" onClick={() => setModalFile(null)}>&times;</button>
              <div className="flex-1 flex items-center justify-center mb-8 md:mb-0">
                {modalFile?.type === 'image' && modalFile?.url && modalFile?.name ? (
                  <Image src={modalFile.url} alt={modalFile.name} width={300} height={300} className="max-w-xs max-h-[60vh] rounded mx-auto" />
                ) : (
                  <a href={modalFile?.url || '#'} target="_blank" rel="noopener noreferrer" className="text-[#6c63ff] underline text-lg">Open file</a>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center pl-0 md:pl-8">
                <div className="mb-2 text-base md:text-lg font-bold text-gray-900">{modalFile?.name ?? '--'}</div>
                <div className="mb-2 text-gray-700 text-sm md:text-base">Size: {typeof modalFile?.size === 'number' ? `${(modalFile.size / 1024 / 1024).toFixed(2)} MB` : '--'}</div>
                <div className="mb-2 text-gray-700 text-sm md:text-base">Uploaded by: {modalFile?.uploader_email ?? '--'}</div>
                <div className="mb-2 text-gray-700 text-sm md:text-base">Type: {modalFile?.type ?? '--'}</div>
                <div className="mb-2 text-gray-700 text-sm md:text-base">Uploaded at: {modalFile?.uploaded_at ? new Date(modalFile.uploaded_at as string).toLocaleString() : '--'}</div>
                <button className="mt-4 px-4 py-2 rounded bg-[#6c63ff] text-white font-semibold shadow hover:bg-[#5548c8] transition" onClick={() => modalFile && handleDownloadFile(modalFile)}>Download</button>
                <button className="mt-2 px-4 py-2 rounded bg-[#ff4d4f] text-white font-semibold shadow hover:bg-[#d43f3a] transition" onClick={() => { modalFile && handleDeleteFile(modalFile); setModalFile(null); }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Custom context menu for file actions */}
        {contextMenu.visible && contextMenu.file && (
          <div
            className="fixed z-50 bg-white border border-[#e0e7ff] rounded shadow-lg py-2 px-4 flex flex-col"
            style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 160 }}
          >
            <button className="text-left py-2 px-2 hover:bg-[#f3f4fe] rounded" onClick={() => handleOpenModal(contextMenu.file!)}>Open</button>
            <button className="text-left py-2 px-2 hover:bg-[#f3f4fe] rounded" onClick={() => handleSelectFile(contextMenu.file!.id)}>{selectedFiles.includes(contextMenu.file!.id) ? 'Unselect' : 'Select'}</button>
            <button className="text-left py-2 px-2 hover:bg-[#f3f4fe] rounded" onClick={() => handleDownloadFile(contextMenu.file!)}>Download</button>
            <button className="text-left py-2 px-2 hover:bg-[#f3f4fe] rounded text-[#ff4d4f]" onClick={() => { handleDeleteFile(contextMenu.file!); setContextMenu({ ...contextMenu, visible: false }); }}>Delete</button>
          </div>
        )}
      </main>
    </div>
  );
}
