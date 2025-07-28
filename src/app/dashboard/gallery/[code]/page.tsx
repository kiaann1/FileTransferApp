"use client";
import { useEffect, useState, useRef, useCallback } from "react";
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
  last_modified?: string | Date;
  uploader_email?: string;
  uploaded_at?: string;
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
  const [fetchError, setFetchError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
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
  // Collaborator state
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorError, setCollaboratorError] = useState("");
  const [collaboratorSuccess, setCollaboratorSuccess] = useState("");
  

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

  const handleFileUpload = useCallback(async (filesList: File[] | FileList) => {
    if (!gallery) return;
    // Check authentication before uploading
    const user = await supabase.auth.getUser();
    if (!user || !user.data?.user) {
      alert("You must be logged in to upload files.");
      return;
    }
    setUploading(true);
    let uploaded = false;
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const timestamp = Date.now();
      const filePath = `${gallery.code}/${timestamp}_${file.name}`;
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
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
      const { error: dbError } = await supabase.from("gallery_files").insert({
        gallery_id: gallery.id, 
        name: file.name,
        type: dbType,
        url: urlData?.publicUrl || null,
        uploader_email: user.data.user.email,
        uploaded_at: new Date(timestamp).toISOString(),
        size: file.size,
      });
      if (!dbError) uploaded = true;
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
    setFetchError(error.message || JSON.stringify(error));
    console.error('Error fetching files:', error);
  } else {
    setFetchError("");
  }
  setFiles(filesData || []);
}

// Fix infinite loop in gallery and files fetch
useEffect(() => {
  if (!code) return;
  let isMounted = true;
  const fetchGallery = async () => {
    const { data: galleryData, error } = await supabase
      .from("galleries")
      .select("id, name, code, password")
      .eq("code", code)
      .single();
    if (isMounted) {
      if (error || !galleryData) {
        router.replace("/dashboard");
        return;
      }
      setGallery(galleryData);
      if (galleryData.password) {
        setShowPasswordModal(true);
      }
      setLoading(false);
    }
  };
  fetchGallery();
  return () => { isMounted = false; };
}, [code]);

useEffect(() => {
  let isMounted = true;
  async function fetchIfNeeded() {
    if (gallery && (!gallery.password || !showPasswordModal)) {
      await fetchFiles(gallery.id);
    }
  }
  fetchIfNeeded();
  return () => { isMounted = false; };
}, [gallery?.id, showPasswordModal]);

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

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-[#e0e7ff] flex flex-col justify-between py-8 px-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <span className="inline-block bg-[#6c63ff] rounded-full p-2"><svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" rx="8" fill="#b3b3ff"/></svg></span>
            <span className="text-2xl font-bold text-[#6c63ff]">FileTransfer</span>
          </div>
          <nav className="flex flex-col gap-2">
            {sidebarNav.map(item => (
              <a key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 font-semibold hover:bg-[#f3f4fe] transition">
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
        </div>
        {/* User info */}
        <div className="flex items-center gap-3 mt-10">
          <span className="inline-block w-10 h-10 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#6c63ff] font-bold text-xl">U</span>
          <div>
            <div className="font-semibold text-gray-900">User Name</div>
            <div className="text-sm text-gray-500">user@email.com</div>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 px-12 py-10">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">{gallery?.name || "Gallery"}</h1>
            <div className="text-gray-400 font-medium">All your uploaded files, assets, and documents in one place.</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg bg-[#f3f4fe] px-4 py-2 rounded-lg border border-[#b3b3ff] text-black">{gallery?.code || "-"}</span>
            <button
              className="px-4 py-2 rounded-lg bg-[#6c63ff] text-white font-semibold shadow hover:bg-[#5548c8] transition text-base"
              onClick={() => {
                if (gallery?.code) {
                  navigator.clipboard.writeText(gallery.code);
                }
              }}
            >Copy</button>
          </div>
        </div>
        {/* Upload box */}
        <div className="mb-10">
          <div ref={dropRef} className="rounded-2xl border-2 border-[#b3b3ff] bg-white p-10 flex flex-col items-center justify-center text-center shadow-sm" style={{ minHeight: 180 }}>
            <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center w-full">
              <div className="flex items-center gap-6 mb-3">
                <span className="inline-block bg-[#f3f4fe] rounded-full p-4"><svg width="40" height="40" fill="none" viewBox="0 0 40 40"><rect x="10" y="20" width="20" height="10" rx="5" fill="#b3b3ff"/><path d="M20 25V15" stroke="#6c63ff" strokeWidth="3" strokeLinecap="round"/><path d="M15 20l5-5 5 5" stroke="#6c63ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                <span className="inline-block bg-[#f3f4fe] rounded-full p-4"><svg width="40" height="40" fill="none" viewBox="0 0 40 40"><rect x="10" y="10" width="20" height="20" rx="5" fill="#b3b3ff"/><text x="20" y="28" textAnchor="middle" fontSize="14" fill="#6c63ff">PDF</text></svg></span>
              </div>
              <span className="text-xl font-semibold text-[#6c63ff]">Click here to upload your file or drag.</span>
              <span className="text-sm text-gray-400 mt-2">Supported Format: SVG, JPG, PNG, PDF, DOC, HTML, TSX (10mb each)</span>
              <input type="file" multiple className="hidden" id="file-upload-input" onChange={e => { if (e.target.files) handleFileUpload(e.target.files); }} disabled={uploading} />
              {uploading && <span className="mt-2 text-[#6c63ff]">Uploading...</span>}
            </label>
          </div>
        </div>
        {/* Debug output: show raw files, sortedFiles, and gallery object */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900">
          <strong>Debug: files array</strong>
          <pre>{JSON.stringify(files, null, 2)}</pre>
          <strong>Debug: sortedFiles array</strong>
          <pre>{JSON.stringify(sortedFiles, null, 2)}</pre>
          <strong>Debug: gallery object</strong>
          <pre>{JSON.stringify(gallery, null, 2)}</pre>
        </div>
        {/* File table */}
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xl font-bold text-gray-900">Attached Files <span className="text-xs text-[#6c63ff] font-semibold ml-2">{files.length} Total</span></div>
            <div className="flex gap-3 items-center">
              {/* Search and collaborator UI temporarily hidden for debugging */}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-base">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-3 font-semibold text-gray-600">File Name</th>
                  <th className="py-3 px-3 font-semibold text-gray-600">File Size</th>
                  <th className="py-3 px-3 font-semibold text-gray-600">Uploaded By</th>
                  <th className="py-3 px-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiles.length === 0 ? (
                  <tr><td colSpan={4} className="text-gray-400 text-center py-12 text-lg">No files uploaded yet.</td></tr>
                ) : (
                  sortedFiles.map(file => (
                    <tr key={file.id} className="border-b hover:bg-[#f3f4fe]">
                      <td className="py-3 px-3 flex items-center gap-3">
                        {/* File type icon and preview, clickable to open modal */}
                        <span className="inline-block bg-[#e0e7ff] rounded p-2 cursor-pointer" onClick={() => handleOpenModal(file)}>
                          {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="w-10 h-10 object-cover rounded" />
                          ) : file.type === 'file' ? (
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="3" fill="#6c63ff"/><rect x="9" y="15" width="6" height="2" rx="1" fill="#b3b3ff"/></svg>
                          ) : file.type === 'folder' ? (
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="8" rx="3" fill="#fbbf24"/></svg>
                          ) : null}
                        </span>
                        <span className="font-semibold text-gray-900">{file.name}</span>
                      </td>
                      {/* File size from metadata or fallback */}
                      <td className="py-3 px-3 text-gray-700">{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '--'}</td>
                      {/* Uploaded by: actual email if available */}
                      <td className="py-3 px-3 flex items-center gap-3">
                        <span className="inline-block w-9 h-9 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#6c63ff] font-bold text-lg">{file.name[0]?.toUpperCase() || '?'}</span>
                        <span className="text-gray-700 font-medium">{file.uploader_email || '--'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <button className="text-[#ff4d4f] font-semibold mr-3 hover:underline" onClick={() => handleDeleteFile(file)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Preview modal */}
        {modalFile && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setModalFile(null)}>
    <div className="bg-white rounded-2xl p-8 shadow-lg relative" onClick={e => e.stopPropagation()}>
      <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 text-xl" onClick={() => setModalFile(null)}>&times;</button>
      <div className="flex flex-col items-center">
        <div className="mb-4 text-lg font-bold text-gray-900">{modalFile.name}</div>
        {modalFile.type === 'image' ? (
          <img src={modalFile.url} alt={modalFile.name} className="max-w-md max-h-[60vh] rounded" />
        ) : (
          <a href={modalFile.url} target="_blank" rel="noopener noreferrer" className="text-[#6c63ff] underline">Open file</a>
        )}
        <div className="mt-4 text-gray-700">Size: {modalFile.size ? `${(modalFile.size / 1024 / 1024).toFixed(2)} MB` : '--'}</div>
        <div className="mt-1 text-gray-700">Uploaded by: {modalFile.uploader_email || '--'}</div>
      </div>
    </div>
  </div>
)}
      </main>
    </div>
  );
}
