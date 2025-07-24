"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

type GalleryFile = {
  id: string;
  name: string;
  url: string;
  size?: number;
  type: string;
  // add other fields as needed
};

export default function GalleryPage() {
  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [settingsError, setSettingsError] = useState("");
  // Folder modal state
  const [activeFolder, setActiveFolder] = useState<GalleryFile | null>(null);
  const [folderFiles, setFolderFiles] = useState<GalleryFile[]>([]);
  const [folderUploading, setFolderUploading] = useState(false);
  // Multi-select state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const router = useRouter();
  const { code } = useParams();
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
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'files' | 'folders'>('all');
  // Context menu and modal state
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; file: GalleryFile | null }>({ visible: false, x: 0, y: 0, file: null });
  const [modalFile, setModalFile] = useState<GalleryFile | null>(null);
  const [modalFileSize, setModalFileSize] = useState<number | null>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");
  const [toast, setToast] = useState<string>("");
  const [accordionTab, setAccordionTab] = useState<'meta' | 'comments'>('meta');
  // New Folder modal state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderError, setNewFolderError] = useState("");
  

  // Open modal handler
  async function handleOpenModal(file: GalleryFile) {
    setModalFile(file);
    // Try to get file size from Supabase Storage if not present
    if (!file.size) {
      const filePath = file.url?.split('/').slice(-2).join('/');
      const { data } = await supabase.storage.from('gallery-files').list(filePath.split('/')[0], { search: filePath.split('/')[1] });
      if (data && data.length > 0) setModalFileSize(data[0].metadata.size || null);
      else setModalFileSize(null);
    } else {
      setModalFileSize(file.size);
    }
    setComments([]); // Reset comments for demo
  }

  // Delete file handler
  async function handleDeleteFile(file: GalleryFile | null) {
    if (!file) return;
    if (!window.confirm(`Delete ${file.name}? This cannot be undone.`)) return;
    // Extract file path from URL (adjust if your URL format is different)
    const urlParts = file.url?.split('/');
    const filePath = urlParts.slice(urlParts.length - 2).join('/');
    await supabase.storage.from('gallery-files').remove([filePath]);
    await supabase.from('gallery_files').delete().eq('id', file.id);
    if (gallery) {
      fetchFiles(gallery.id);
    }
  }

  // Bulk delete handler
  async function handleBulkDelete() {
    if (selectedFiles.length === 0) return;
    if (!window.confirm(`Delete ${selectedFiles.length} selected file(s)? This cannot be undone.`)) return;
    // Get file objects
    const filesToDelete = files.filter(f => selectedFiles.includes(f.id));
    // Remove from bucket
    const filePaths = filesToDelete
      .map(file => {
        if (!file.url) return undefined;
        const urlParts = file.url.split('/');
        return urlParts.slice(urlParts.length - 2).join('/');
      })
      .filter((p): p is string => typeof p === 'string');
    if (filePaths.length > 0) {
      await supabase.storage.from('gallery-files').remove(filePaths);
    }
    // Remove from DB (single query for all IDs)
    await supabase.from('gallery_files').delete().in('id', selectedFiles);
    setSelectedFiles([]);
    if (gallery) {
      fetchFiles(gallery.id);
    }
  }

  // Hide context menu on click elsewhere
  useEffect(() => {
    function handleClick() {
      if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
    }
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  // Fetch gallery by code
  useEffect(() => {
    if (!code) return;
    async function fetchGallery() {
      const { data: galleryData, error } = await supabase
        .from("galleries")
        .select("*")
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
    })();
    // Paste handler for images
    function handlePaste(e: ClipboardEvent): void {
      if (uploading) return;
      // Only allow paste if not focused on an input/textarea
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      if (e.clipboardData) {
        console.log('PASTE EVENT: clipboardData', e.clipboardData);
        let found = false;
        const items = e.clipboardData.items;
        console.log('PASTE EVENT: clipboardData.items', items);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          console.log('PASTE EVENT: item', item);
          if (item.kind === "file" && (item.type === "image/png" || item.type === "image/jpeg" || item.type.startsWith("image"))) {
            const file = item.getAsFile();
            console.log('PASTE EVENT: found image file', file);
            if (file) {
              handleFileUpload([file]);
              e.preventDefault();
              found = true;
              break;
            }
          }
        }
        // Fallback: check clipboardData.files (for some browsers)
        if (!found && e.clipboardData.files && e.clipboardData.files.length > 0) {
          console.log('PASTE EVENT: clipboardData.files', e.clipboardData.files);
          handleFileUpload(e.clipboardData.files);
          e.preventDefault();
        }
      } else {
        console.log('PASTE EVENT: No clipboardData');
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [code, router, uploading]);

  // Fetch files when gallery is set and not password protected, or when password modal is closed
  useEffect(() => {
    if (gallery && (!gallery.password || !showPasswordModal)) {
      fetchFiles(gallery.id);
    }
  }, [gallery, showPasswordModal]);

  async function fetchFiles(galleryId: string) {
    const { data: filesData } = await supabase
      .from("gallery_files")
      .select("*")
      .eq("gallery_id", galleryId);
    setFiles(filesData || []);
  }

  async function handleFileUpload(filesList: File[] | FileList) {
    if (!gallery) return;
    setUploading(true);
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const timestamp = Date.now();
      const filePath = `${gallery.code}/${timestamp}_${file.name}`;
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("gallery-files")
        .upload(filePath, file, {
          cacheControl: "3600", 
          upsert: false,
        });
      if (uploadError) {
        alert(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("gallery-files")
        .getPublicUrl(filePath);
      // Insert metadata into gallery_files table
      let dbType: 'image' | 'file' | 'folder' = 'file';
      if (file.type && file.type.startsWith('image')) dbType = 'image';
      const { error: insertError, data: insertData } = await supabase.from("gallery_files").insert({
        gallery_id: gallery.id, 
        name: file.name,
        type: dbType,
        url: urlData?.publicUrl || null,
      });
    }
    setUploading(false);
    fetchFiles(gallery.id);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gallery) return;
    if (passwordInput === gallery.password) {
      setShowPasswordModal(false);
      setPasswordError("");
      fetchFiles(gallery.id);
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  }

  if (loading) {
    return <div className="p-8">Loading gallery...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Top Navigation */}
      <div className="w-full flex items-center justify-start px-6 pt-6 pb-2">
        <button
          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold text-lg bg-blue-50 px-4 py-2 rounded-xl shadow hover:bg-blue-100 transition"
          onClick={() => router.push("/dashboard")}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M12.5 15l-5-5 5-5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Galleries
        </button>
      </div>
      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-1">{gallery?.name || "Gallery"}</h1>
            <div className="text-sm text-gray-400 font-mono">Code: {gallery?.code}</div>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition" onClick={() => setShowNewFolderModal(true)}>New Folder</button>
            <button className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200 transition" onClick={() => {
              setSettingsName(gallery?.name || "");
              setSettingsPassword(gallery?.password || "");
              setShowSettingsModal(true);
            }}>Settings</button>
          </div>
        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowSettingsModal(false)}>
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gallery Settings</h2>
              <form className="flex flex-col gap-6" onSubmit={async e => {
                e.preventDefault();
                setSettingsError("");
                // Update gallery name and password
                if (!settingsName.trim()) {
                  setSettingsError("Gallery name is required.");
                  return;
                }
                if (gallery) {
                  await supabase.from("galleries").update({
                    name: settingsName.trim(),
                    password: settingsPassword.trim() || null
                  }).eq("id", gallery.id);
                  setShowSettingsModal(false);
                  fetchFiles(gallery.id);
                }
              }}>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Gallery Name</label>
                  <input type="text" value={settingsName} onChange={e => setSettingsName(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Gallery name" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Gallery Password</label>
                  <input type="text" value={settingsPassword} onChange={e => setSettingsPassword(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Set or change password" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Invite User (Email)</label>
                  <div className="flex gap-2">
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="user@email.com" />
                    <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded font-semibold shadow hover:bg-blue-700 transition" onClick={async () => {
                      if (!inviteEmail.trim()) return;
                      // Insert into gallery_members (stub, add actual user logic as needed)
                      if (gallery) {
                        await supabase.from("gallery_members").insert({
                          gallery_id: gallery.id,
                          email: inviteEmail.trim()
                        });
                      }
                      setInviteEmail("");
                    }}>Invite</button>
                  </div>
                </div>
                {settingsError && <div className="text-red-600 text-sm">{settingsError}</div>}
                <div className="flex gap-4 justify-end mt-4">
                  <button type="button" className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition" onClick={() => setShowSettingsModal(false)}>Close</button>
                  <button type="submit" className="px-6 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition">Save</button>
                </div>
              </form>
              <button className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl font-bold bg-white rounded-full shadow p-2 transition" onClick={() => setShowSettingsModal(false)} aria-label="Close">&times;</button>
            </div>
          </div>
        )}
        </div>
        {/* New Folder Modal */}
        {showNewFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowNewFolderModal(false)}>
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Folder</h2>
              <form onSubmit={async e => {
                e.preventDefault();
                if (!newFolderName.trim()) {
                  setNewFolderError("Folder name is required.");
                  return;
                }
                setNewFolderError("");
                // Insert folder into DB
                if (gallery) {
                  await supabase.from("gallery_files").insert({
                    gallery_id: gallery.id,
                    name: newFolderName.trim(),
                    type: "folder",
                    url: null
                  });
                  setShowNewFolderModal(false);
                  setNewFolderName("");
                  fetchFiles(gallery.id);
                  setActiveTab('folders');
                }
              }} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Folder name"
                  autoFocus
                />
                {newFolderError && <div className="text-red-600 text-sm">{newFolderError}</div>}
                <button type="submit" className="mt-2 px-6 py-3 rounded bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">Create Folder</button>
              </form>
              <button className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl font-bold bg-white rounded-full shadow p-2 transition" onClick={() => setShowNewFolderModal(false)} aria-label="Close">&times;</button>
            </div>
          </div>
        )}
        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Gallery Password</h2>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Gallery password"
                  autoFocus
                />
                {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
                <button type="submit" className="mt-2 px-6 py-3 rounded bg-blue-600 text-white text-lg font-semibold shadow hover:bg-blue-700 transition">Access Gallery</button>
              </form>
            </div>
          </div>
        )}
        {/* Gallery Files & Dropbox */}
        {!showPasswordModal && (
          <div className="">
            {/* Dropbox Area */}
            <div
              ref={dropRef}
              className={`mb-10 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 transition ${uploading ? "bg-blue-50" : "bg-white"}`}
              style={{ minHeight: 200, cursor: uploading ? "not-allowed" : "pointer" }}
              onDragOver={e => { e.preventDefault(); dropRef.current!.classList.add("border-blue-500"); }}
              onDragLeave={e => { e.preventDefault(); dropRef.current!.classList.remove("border-blue-500"); }}
              onDrop={e => {
                e.preventDefault();
                dropRef.current!.classList.remove("border-blue-500");
                if (uploading) return;
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files);
                }
              }}
            >
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload-input"
                onChange={e => {
                  if (e.target.files) handleFileUpload(e.target.files);
                }}
                disabled={uploading}
              />
              <label htmlFor="file-upload-input" className="flex flex-col items-center cursor-pointer">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="32" width="48" height="20" rx="8" fill="#E0E7FF"/>
                  <path d="M32 44V24" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M24 32l8-8 8 8" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <ellipse cx="32" cy="54" rx="4" ry="2" fill="#2563EB"/>
                </svg>
                <span className="mt-3 text-xl text-gray-700 font-medium">Upload or drag files here <span className="text-blue-600 underline">Browse</span></span>
                {uploading && <span className="mt-2 text-blue-600">Uploading...</span>}
              </label>
            </div>
            {/* Tabs */}
            <div className="mb-8 flex gap-2 border-b border-gray-200 items-center">
              <button onClick={() => setActiveTab('all')} className={`px-5 py-2 font-semibold rounded-t-xl transition ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-600 bg-white'}`}>All</button>
              <button onClick={() => setActiveTab('images')} className={`px-5 py-2 font-semibold rounded-t-xl transition ${activeTab === 'images' ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-600 bg-white'}`}>Images</button>
              <button onClick={() => setActiveTab('files')} className={`px-5 py-2 font-semibold rounded-t-xl transition ${activeTab === 'files' ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-600 bg-white'}`}>Files</button>
              <button onClick={() => setActiveTab('folders')} className={`px-5 py-2 font-semibold rounded-t-xl transition ${activeTab === 'folders' ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-600 bg-white'}`}>Folders</button>
              {/* Bulk delete button if files are selected */}
              {selectedFiles.length > 0 && (
                <button
                  className="ml-auto px-5 py-2 bg-red-600 text-white rounded-xl font-semibold shadow hover:bg-red-700 transition"
                  onClick={handleBulkDelete}
                >
                  Delete Selected ({selectedFiles.length})
                </button>
              )}
            </div>
            {/* File List by Tab */}
            {(() => {
              let filtered = files;
              if (activeTab === 'images') filtered = files.filter(f => f.type === 'image');
              else if (activeTab === 'files') filtered = files.filter(f => f.type === 'file');
              else if (activeTab === 'folders') filtered = files.filter(f => f.type === 'folder');
              // 'all' tab: show all files
              if (filtered.length === 0) return <div className="text-gray-400 text-lg text-center py-12">No files in this section.</div>;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filtered.map(file => (
                    file.type === 'folder' ? (
                      <div
                        key={file.id}
                        className={`group bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center border hover:shadow-xl transition cursor-pointer relative`}
                        onClick={async () => {
                          setActiveFolder(file);
                          // Fetch files in this folder
                          if (gallery) {
                            const { data: folderFilesData } = await supabase
                              .from("gallery_files")
                              .select("*")
                              .eq("gallery_id", gallery.id)
                              .eq("type", "file")
                              .like("url", `%/${file.name}/%`);
                            setFolderFiles(folderFilesData || []);
                          }
                        }}
                      >
                        <div className="text-gray-400 mb-2"><svg width="40" height="40" fill="none" viewBox="0 0 32 32"><rect x="4" y="10" width="24" height="12" rx="3" fill="#FBBF24"/><rect x="4" y="6" width="10" height="8" rx="2" fill="#FDE68A"/></svg></div>
                        <div className="font-semibold text-gray-900 mb-1 truncate w-full text-center">{file.name}</div>
                        <div className="text-gray-500 text-xs mb-2">Folder</div>
                      </div>
                    ) : (
                      <div
                        key={file.id}
                        className={`group bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center border ${selectedFiles.includes(file.id) ? 'border-blue-600' : 'border-gray-100'} hover:shadow-xl transition cursor-pointer relative`}
                        onContextMenu={e => {
                          e.preventDefault();
                          setContextMenu({ visible: true, x: e.clientX, y: e.clientY, file });
                        }}
                      >
                        <div className="w-full flex justify-center mb-4">
                          {file.type === 'image' ? (
                          <Image src={file.url} alt={file.name} width={320} height={160} className="rounded-xl max-h-40 max-w-full shadow border group-hover:scale-105 transition cursor-pointer"
                              onClick={async (e: React.MouseEvent<HTMLImageElement>) => {
                                e.preventDefault();
                                try {
                                  const response = await fetch(file.url);
                                  const blob = await response.blob();
                                  await navigator.clipboard.write([
                                    new window.ClipboardItem({ [blob.type]: blob })
                                  ]);
                                  setToast("Image copied to clipboard!");
                                } catch (err) {
                                  setToast("Failed to copy image");
                                }
                                setTimeout(() => setToast(""), 2000);
                              }}
                            />
                          ) : (
                            <div className="text-gray-400"><svg width="40" height="40" fill="none" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" rx="4" fill="#2563EB"/><rect x="10" y="14" width="12" height="4" rx="2" fill="white"/></svg></div>
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 mb-1 truncate w-full text-center">{file.name}</div>
                        <div className="text-gray-500 text-xs mb-2">{file.size} bytes</div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                          <button className="px-2 py-1 bg-blue-50 text-blue-700 rounded shadow hover:bg-blue-100 text-xs font-semibold" onClick={() => handleOpenModal(file)}>Preview</button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              );
            })()}
            {/* Folder Modal */}
            {activeFolder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg" onClick={() => setActiveFolder(null)}>
                <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-3xl min-h-[500px] relative flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex flex-col gap-4 p-8">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">Folder: {activeFolder.name}</h2>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition" onClick={async () => {
                        // TODO: Download folder as ZIP (stub)
                        // You will need JSZip or similar for actual implementation
                        alert('Download as ZIP coming soon!');
                      }}>Download as ZIP</button>
                    </div>
                    <div className="mb-4">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        id="folder-upload-input"
                        onChange={async e => {
                          if (!e.target.files) return;
                          setFolderUploading(true);
                          for (let i = 0; i < e.target.files.length; i++) {
                            const file = e.target.files[i];
                            const timestamp = Date.now();
                            const filePath = gallery ? `${gallery.code}/${activeFolder.name}/${timestamp}_${file.name}` : "";
                            const { error: uploadError } = await supabase.storage
                              .from("gallery-files")
                              .upload(filePath, file, {
                                cacheControl: "3600",
                                upsert: false,
                              });
                            if (!uploadError) {
                              const { data: urlData } = supabase.storage
                                .from("gallery-files")
                                .getPublicUrl(filePath);
                              if (gallery) {
                                await supabase.from("gallery_files").insert({
                                  gallery_id: gallery.id,
                                  name: file.name,
                                  type: file.type && file.type.startsWith('image') ? 'image' : 'file',
                                  url: urlData?.publicUrl || null
                                });
                              }
                            }
                          }
                          setFolderUploading(false);
                          // Refresh folder files
                          if (gallery) {
                          if (gallery) {
                            const { data: folderFilesData } = await supabase
                              .from("gallery_files")
                              .select("*")
                              .eq("gallery_id", gallery.id)
                              .eq("type", "file")
                              .like("url", `%/${activeFolder.name}/%`);
                            setFolderFiles(folderFilesData || []);
                          }
                          }
                        }}
                        disabled={folderUploading}
                      />
                      <label htmlFor="folder-upload-input" className="flex flex-col items-center cursor-pointer">
                        <span className="mt-3 text-lg text-gray-700 font-medium">Upload or drag files into this folder <span className="text-blue-600 underline">Browse</span></span>
                        {folderUploading && <span className="mt-2 text-blue-600">Uploading...</span>}
                      </label>
                    </div>
                    <div>
                      <div className="font-semibold mb-2 text-gray-900">Files in this folder</div>
                      {folderFiles.length === 0 ? (
                        <div className="text-gray-400 italic">No files in this folder yet.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {folderFiles.map(f => (
                            <div key={f.id} className="bg-gray-50 rounded-xl p-4 shadow flex flex-col items-center">
                              <div className="font-semibold text-gray-900 mb-1">{f.name}</div>
                              <div className="text-gray-500 text-xs mb-2">{f.size} bytes</div>
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="absolute top-4 right-4 text-gray-500 hover:text-black text-3xl font-bold bg-white rounded-full shadow p-2 transition" onClick={() => setActiveFolder(null)} aria-label="Close">&times;</button>
                </div>
              </div>
            )}
            {/* Context Menu */}
            {contextMenu.visible && (
              <div
                style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
                className="bg-white border rounded shadow-lg py-2 w-40"
                onClick={() => setContextMenu({ ...contextMenu, visible: false })}
              >
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black" onClick={() => { if (contextMenu.file) handleOpenModal(contextMenu.file); setContextMenu({ ...contextMenu, visible: false }); }}>Open</button>
                <a className="w-full block px-4 py-2 hover:bg-gray-100 text-left text-black" href={contextMenu.file?.url} download target="_blank" rel="noopener noreferrer" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>Download</a>
                <button className="w-full text-left px-4 py-2 hover:bg-gray text-red-600" onClick={() => { if (contextMenu.file) handleDeleteFile(contextMenu.file); setContextMenu({ ...contextMenu, visible: false }); }}>Delete</button>
                <button className="w-full text-left px-4 py-2 hover:bg-blue-100 text-blue-700" onClick={() => {
                  if (contextMenu.file) {
                    setSelectedFiles(prev => prev.includes(contextMenu.file!.id)
                      ? prev.filter(id => id !== contextMenu.file!.id)
                      : [...prev, contextMenu.file!.id]);
                  }
                  setContextMenu({ ...contextMenu, visible: false });
                }}>Select</button>
              </div>
            )}
            {/* Image Modal */}
            {modalFile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg" onClick={() => setModalFile(null)}>
                <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-5xl min-h-[650px] relative flex flex-row overflow-hidden" onClick={e => e.stopPropagation()}>
                  {/* Left: Image Preview or File Icon */}
                  <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white p-8 gap-6 border-r border-gray-200">
                    {modalFile.type === 'image' ? (
                      <Image src={modalFile.url} alt={modalFile.name} width={350} height={350} className="rounded-xl max-h-[350px] max-w-full shadow-lg border" />
                    ) : modalFile.type === 'folder' ? (
                      <div className="mb-2 text-gray-400"><svg width="64" height="64" fill="none" viewBox="0 0 32 32"><rect x="4" y="10" width="24" height="12" rx="3" fill="#FBBF24"/><rect x="4" y="6" width="10" height="8" rx="2" fill="#FDE68A"/></svg></div>
                    ) : (
                      <div className="mb-2 text-gray-400"><svg width="64" height="64" fill="none" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" rx="4" fill="#2563EB"/><rect x="10" y="14" width="12" height="4" rx="2" fill="white"/></svg></div>
                    )}
                    <div className="font-bold text-xl text-gray-900 break-all text-center mt-2">{modalFile.name}</div>
                    <div className="flex gap-4 text-gray-700 text-sm mt-2">
                      <span>Size: <span className="font-medium">{modalFileSize !== null ? modalFileSize : modalFile.size} bytes</span></span>
                      <span>Type: <span className="font-medium">{modalFile.type}</span></span>
                    </div>
                  </div>
                  {/* Right: Tabbed Accordion */}
                  <div className="flex-1 flex flex-col bg-white p-8">
                    <div className="mb-4">
                      <div className="flex gap-2 border-b mb-4">
                        <button className={`px-4 py-2 font-semibold rounded-t ${accordionTab === 'meta' ? 'border-b-2 border-blue-600 text-blue-700 bg-gray-50' : 'text-gray-600 bg-white'}`} onClick={() => setAccordionTab('meta')}>Metadata</button>
                        <button className={`px-4 py-2 font-semibold rounded-t ${accordionTab === 'comments' ? 'border-b-2 border-blue-600 text-blue-700 bg-gray-50' : 'text-gray-600 bg-white'}`} onClick={() => setAccordionTab('comments')}>Comments</button>
                      </div>
                      {/* Accordion Content */}
                      {accordionTab === 'meta' && (
                        <div className="mt-2">
                          <div className="font-semibold mb-2 text-gray-900">File Metadata</div>
                          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 shadow-inner border max-h-64 overflow-auto">
                            <div className="mb-2"><span className="font-semibold">Name:</span> {modalFile.name}</div>
                            <div className="mb-2"><span className="font-semibold">Type:</span> {modalFile.type}</div>
                            <div className="mb-2"><span className="font-semibold">Size:</span> {modalFileSize !== null ? modalFileSize : modalFile.size} bytes</div>
                            <div className="mb-2"><span className="font-semibold">URL:</span> <a href={modalFile.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">Open in new tab</a></div>
                            {/* Add more metadata fields as needed */}
                          </div>
                        </div>
                      )}
                      {accordionTab === 'comments' && (
                        <div className="mt-2">
                          <div className="font-semibold mb-2 text-gray-900 flex items-center gap-2">
                            Comments
                            <span className="text-xs text-gray-400 font-normal">({comments.length})</span>
                          </div>
                          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 min-h-[120px] text-gray-800 shadow-lg border flex flex-col gap-4">
                            {comments.length === 0 && <div className="text-gray-400 italic text-center">No comments yet. Be the first to add one!</div>}
                            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                              {comments.map((c, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">{c[0]?.toUpperCase() || "C"}</div>
                                  <div className="bg-white rounded-xl px-4 py-2 shadow border text-sm flex-1">{c}</div>
                                </div>
                              ))}
                            </div>
                            <form onSubmit={e => { e.preventDefault(); if (newComment.trim()) { setComments([...comments, newComment.trim()]); setNewComment(""); } }} className="flex gap-2 mt-2">
                              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} className="border-2 border-blue-200 rounded-xl px-4 py-2 flex-1 text-black bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add a comment..." />
                              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition">Send</button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="absolute top-4 right-4 text-gray-500 hover:text-black text-3xl font-bold bg-white rounded-full shadow p-2 transition" onClick={() => setModalFile(null)} aria-label="Close">&times;</button>
                </div>
              </div>
            )}
            {/* Toast for copy to clipboard */}
            {toast && (
              <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow z-[9999]">{toast}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
