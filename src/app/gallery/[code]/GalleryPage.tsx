"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

interface ImageItem {
  id: number;
  filename: string;
  createdAt: string;
}

export default function GalleryPage() {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{visible: boolean, x: number, y: number, img: ImageItem | null}>({visible: false, x: 0, y: 0, img: null});
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // const [error, setError] = useState("");
  const [dark, setDark] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [modalMeta, setModalMeta] = useState<string>("");
  const [showManage, setShowManage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // Fetch images
  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch(`/api/gallery/${code}/images`)
      .then((res) => res.json())
      .then(setImages)
      .catch(() => {/* error handling removed */})
      .finally(() => setLoading(false));
  }, [code]);

  // Upload handler
  const uploadImage = useCallback(async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/gallery/${code}/images`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const img = await res.json();
      setImages((prev) => [img, ...prev]);
    }
    setUploading(false);
  }, [code]);

  // Drag & drop
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dropAreaRef.current?.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(uploadImage);
    }
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropAreaRef.current?.classList.add("dragover");
  };
  const onDragLeave = () => {
    dropAreaRef.current?.classList.remove("dragover");
  };

  // Paste
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // Prefer files if available
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        Array.from(e.clipboardData.files).forEach(uploadImage);
        return;
      }
      // Fallback: check items for images
      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) uploadImage(file);
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploadImage]);

  // Browse
  const onBrowse = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      Array.from(e.target.files).forEach(uploadImage);
    }
  };

  // Delete
  const deleteImage = async (id: number) => {
    const result = await Swal.fire({
      title: 'Delete this image?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
    });
    if (!result.isConfirmed) return;
    await fetch(`/api/gallery/${code}/images/${id}`, { method: "DELETE" });
    setImages((prev) => prev.filter((img) => img.id !== id));
    await Swal.fire({
      title: 'Deleted!',
      text: 'The image has been removed.',
      icon: 'success',
      timer: 1200,
      showConfirmButton: false,
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
    });
  };

  // Delete all
  const deleteAll = async () => {
    if (!images.length) return;
    const result = await Swal.fire({
      title: 'Delete all images?',
      text: 'This will remove all images from your library. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete All',
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
    });
    if (!result.isConfirmed) return;
    await Promise.all(images.map(img => fetch(`/api/gallery/${code}/images/${img.id}`, { method: "DELETE" })));
    setImages([]);
    await Swal.fire({
      title: 'Deleted!',
      text: 'All images have been removed.',
      icon: 'success',
      timer: 1200,
      showConfirmButton: false,
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
    });
  };

  // Copy to clipboard
  const copyImage = async (filename: string) => {
    try {
      const res = await fetch(`/uploads/${filename}`);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type]: blob })
      ]);
      showCopyNotice();
    } catch {
      alert("Failed to copy image.");
    }
  };

  // Modal
  const openModal = async (filename: string) => {
    const url = `/uploads/${filename}`;
    setModalImg(url);
    setModalMeta('Loading...');
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const type = blob.type;
      const size = blob.size;
      // Wait for image to load to get resolution
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        const dims = `${img.naturalWidth} × ${img.naturalHeight}px`;
        setModalMeta(
          `<b>Filename:</b> ${filename}<br>` +
          `<b>Type:</b> ${type || 'Unknown'}<br>` +
          `<b>Size:</b> ${formatSize(size)}<br>` +
          `<b>Resolution:</b> ${dims}`
        );
      };
    } catch {
      setModalMeta('Could not load image info.');
    }
  };

  function formatSize(bytes: number) {
    if (bytes > 1e6) return (bytes/1e6).toFixed(2) + ' MB';
    if (bytes > 1e3) return (bytes/1e3).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  const closeModal = () => setModalImg(null);

  // Dark mode
  useEffect(() => {
    if (dark) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [dark]);

  // Copy notice
  const showCopyNotice = () => {
    const notice = document.getElementById('copy-notice');
    if (!notice) return;
    notice.style.display = 'block';
    notice.style.opacity = '1';
    const win = window as Window & { _copyNoticeTimeout?: number };
    clearTimeout(win._copyNoticeTimeout);
    win._copyNoticeTimeout = window.setTimeout(() => {
      notice.style.opacity = '0';
      setTimeout(() => { notice.style.display = 'none'; }, 300);
    }, 1100);
  };

  // Regenerate gallery code
  const regenerateCode = async () => {
    const result = await Swal.fire({
      title: 'Generate a new gallery code?',
      text: 'This will move all images to a new code and redirect you.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#b6b6d6',
      confirmButtonText: 'Yes, generate new code',
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
    });
    if (!result.isConfirmed) return;
    // 1. Create new gallery
    const res = await fetch("/api/gallery", { method: "POST" });
    const data = await res.json();
    if (!data.code) {
      await Swal.fire({
        title: 'Failed',
        text: 'Failed to generate new code.',
        icon: 'error',
        background: document.body.classList.contains('dark') ? '#232946' : '#fff',
        color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
      });
      return;
    }
    const newCode = data.code;
    // 2. Move all images to new gallery
    await fetch(`/api/gallery/${code}/images/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newCode }),
    });
    // 3. Redirect
    await Swal.fire({
      title: 'Gallery code changed!',
      text: `Your new code is ${newCode}`,
      icon: 'success',
      background: document.body.classList.contains('dark') ? '#232946' : '#fff',
      color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
      timer: 1800,
      showConfirmButton: false,
    });
    router.push(`/gallery/${newCode}`);
  };

  // SVG ICONS
  const HomeIcon = () => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
  );
  const ManageIcon = () => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} /></svg>
  );
  const DarkIcon = ({dark}:{dark:boolean}) => dark
    ? (<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 7.05l-.71-.71M4.05 4.05l-.71-.71" /><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2} /></svg>)
    : (<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>);
  const DeleteAllIcon = () => (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
  );
  const CopyIcon = () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={2}/><rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={2}/></svg>
  );
  const RegenIcon = () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M4.93 19.07A10 10 0 1 1 21 12" stroke="currentColor" strokeWidth="2" fill="none"/>
      <polyline points="20 8 20 12 16 12" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  // Helper to get file icon (always generic)
  function getFileIcon() {
    return "/file.svg";
  }

  return (
    <>
      <header className="gallery-header">
        <Link href="/" className="header-btn" title="Back to Home"><HomeIcon /></Link>
        <button className="header-btn" onClick={()=>setShowManage(true)} title="Manage gallery"><ManageIcon /></button>
        <button className="header-btn" onClick={()=>setDark(d=>!d)} title="Toggle dark mode"><DarkIcon dark={dark} /></button>
        <button className="header-btn" onClick={deleteAll} title="Delete all images"><DeleteAllIcon /></button>
      </header>
      <div className="gallery-header-bar">
        <span className="gallery-header-label">Gallery code:</span>
        <b className="gallery-header-code">{code}</b>
        <button className="gallery-header-icon copy-inline" onClick={async()=>{
          await navigator.clipboard.writeText(code as string);
          await Swal.fire({
            title: 'Copied!',
            text: 'Gallery code copied to clipboard.',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false,
            background: document.body.classList.contains('dark') ? '#232946' : '#fff',
            color: document.body.classList.contains('dark') ? '#e0e7ff' : '#232946',
          });
        }} title="Copy code">
          <CopyIcon />
        </button>
        <button className="gallery-header-icon regen-inline" onClick={regenerateCode} title="Regenerate gallery code">
          <RegenIcon />
        </button>
      </div>
      <div style={{position:'fixed',top:18,right:320,zIndex:1300,display:'flex',gap:10,alignItems:'center'}}>      </div>
      <div style={{position:'fixed',top:18,right:200,zIndex:1300,display:'flex',gap:10,alignItems:'center'}}>
      </div>
      <div ref={dropAreaRef} className="hero" id="drop-area"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onBrowse}
        style={{cursor:'pointer'}}
      >
        <div className="hero-icon">📁</div>
        <div className="hero-text">Drag & drop or paste file(s) here</div>
        <input type="file" multiple ref={fileInputRef} style={{display:'none'}} onChange={onFileChange} />
        <button className="upload-btn" onClick={e => {e.stopPropagation();onBrowse();}} disabled={uploading}>{uploading ? 'Uploading...' : 'Browse'}</button>
        <div style={{fontSize:'0.98rem',color:'#b6b6d6',marginTop:2}}>Any file type — Multi-select supported</div>
      </div>
      <div id="copy-notice" style={{display:'none',position:'fixed',top:32,left:'50%',transform:'translateX(-50%)',zIndex:1000,background:'linear-gradient(90deg,#6366f1 0%,#06b6d4 100%)',color:'#fff',padding:'12px 32px',borderRadius:'32px',fontSize:'1.1rem',fontWeight:600,boxShadow:'0 4px 24px rgba(99,102,241,0.13)',pointerEvents:'none',transition:'opacity 0.2s',opacity:0}}>Image copied!</div>
      <div className={modalImg ? 'modal open' : 'modal'} id="imgModal" onClick={e => {if(e.target===e.currentTarget) closeModal();}}>
        <div className="modal-content">
          <button className="modal-close" onClick={closeModal} title="Close">✕</button>
          {modalImg && (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(modalImg) ? (
            <Image src="/download.svg" alt="Download" width={18} height={18} style={{verticalAlign:'middle'}} />
          ) : (
            <div style={{fontSize:'2.5rem',margin:'32px 0'}}>📄</div>
          ))}
          <div id="modalMeta" style={{marginTop:18,fontSize:'1.08rem',color:'var(--text-main)',textAlign:'center'}} dangerouslySetInnerHTML={{__html: modalMeta}} />
          {modalImg && (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(modalImg)) && (
            <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:12}}>
              <a href={modalImg} download className="file-download-btn" style={{fontSize:'1.05rem',color:'#6366f1',textDecoration:'underline',display:'flex',alignItems:'center',gap:4}}>
                <Image src="/download.svg" alt="Download" width={18} height={18} style={{verticalAlign:'middle'}} />
              </a>
              <button className="file-download-btn" style={{fontSize:'1.05rem',color:'#6366f1',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4}} onClick={()=>copyImage(modalImg.replace('/uploads/',''))}>
                📋
              </button>
            </div>
          )}
        </div>
      </div>
      {showManage && (
        <div className="modal open" style={{zIndex:3000}}>
          <div className="modal-content manage-modal-content">
            <button className="modal-close" onClick={()=>setShowManage(false)} title="Close">✕</button>
            <h2 className="manage-modal-title">Manage Gallery</h2>
            <div className="manage-modal-desc">Who has access, roles, and revoke access UI goes here.</div>
            {/* TODO: Implement actual user/role management logic */}
            <div className="manage-modal-desc" style={{fontSize:'0.98rem'}}>Feature coming soon: assign roles, invite users, revoke access.</div>
          </div>
        </div>
      )}
      <div className="library-row enhanced-gallery" id="library" onClick={() => setContextMenu(c => ({...c, visible: false}))}>
        {loading ? (
          <div className="gallery-list-empty">Loading files...</div>
        ) : images.length === 0 ? (
          <div className="gallery-list-empty">No files yet. Upload or paste to get started!</div>
        ) : (
          images.map(img => {
            const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(img.filename);
            return (
              <div
                key={img.id}
                className="img-wrapper enhanced-card"
                title={img.filename}
                tabIndex={0}
                onContextMenu={e => {
                  e.preventDefault();
                  setContextMenu({visible: true, x: e.clientX, y: e.clientY, img});
                }}
              >
                {isImage ? (
                  <Image
                    src={`/uploads/${img.filename}`}
                    className="library-img enhanced-thumb"
                    title={img.filename}
                    alt={img.filename}
                    style={{userSelect:'none'}}
                    width={140}
                    height={140}
                    onClick={() => copyImage(img.filename)}
                    onDoubleClick={() => openModal(img.filename)}
                    draggable={false}
                  />
                ) : (
                  <div className="library-file-box enhanced-file-box">
                    <Image src={getFileIcon()} alt="File icon" className="enhanced-file-icon" width={38} height={38} />
                    <div className="enhanced-file-name" title={img.filename}>{img.filename}</div>
                    <a href={`/uploads/${img.filename}`} download className="file-download-btn enhanced-download-btn">
                      <Image src="/download.svg" alt="Download" className="enhanced-download-icon" width={16} height={16} /> Download
                    </a>
                  </div>
                )}
                {/* Removed action icons overlay */}
              </div>
            );
          })
        )}
        {contextMenu.visible && contextMenu.img && (
          <ul
            className="custom-context-menu modern-context-menu"
            style={{position:'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 4000}}
            onClick={e => e.stopPropagation()}
          >
            <li className="context-menu-item" onClick={() => { copyImage(contextMenu.img!.filename); setContextMenu(c => ({...c, visible: false})); }}>
              <span className="context-menu-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" stroke="#6366f1" strokeWidth="2"/><rect x="3" y="3" width="13" height="13" rx="2" stroke="#6366f1" strokeWidth="2"/></svg></span>
              Copy
            </li>
            <li className="context-menu-item" onClick={() => { openModal(contextMenu.img!.filename); setContextMenu(c => ({...c, visible: false})); }}>
              <span className="context-menu-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2"><circle cx="12" cy="12" r="8" stroke="#6366f1" strokeWidth="2"/><path d="M12 8v4l3 2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
              View
            </li>
            <li className="context-menu-item" onClick={() => { window.open(`/uploads/${contextMenu.img!.filename}`,'_blank'); setContextMenu(c => ({...c, visible: false})); }}>
              <span className="context-menu-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2"><path d="M12 5v12m0 0l-4-4m4 4l4-4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="17" width="16" height="2" rx="1" fill="#6366f1"/></svg></span>
              Download
            </li>
            <li className="context-menu-item context-menu-delete" onClick={() => { deleteImage(contextMenu.img!.id); setContextMenu(c => ({...c, visible: false})); }}>
              <span className="context-menu-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
              Delete
            </li>
          </ul>
        )}
      </div>
      <style jsx global>{`
        .custom-context-menu.modern-context-menu {
          font-size: 1.08rem;
          box-shadow: 0 8px 32px rgba(99,102,241,0.18);
          background: #fff;
          border-radius: 14px;
          padding: 8px 0;
          min-width: 160px;
          border: 1.5px solid #e0e7ff;
          filter: drop-shadow(0 2px 12px rgba(99,102,241,0.10));
          animation: fadeInMenu 0.18s cubic-bezier(.4,1.3,.6,1) both;
        }
        @keyframes fadeInMenu {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
        .context-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 22px 12px 18px;
          cursor: pointer;
          color: #6366f1;
          font-weight: 500;
          font-size: 1.08rem;
          background: none;
          border: none;
          transition: background 0.13s, color 0.13s, padding-left 0.13s;
          user-select: none;
        }
        .context-menu-item:hover {
          background: #f3f4f6;
          color: #232946;
          padding-left: 26px;
        }
        .context-menu-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
        }
        .context-menu-delete {
          color: #ef4444 !important;
        }
        .context-menu-delete .context-menu-icon svg {
          stroke: #ef4444 !important;
        }
        .enhanced-gallery {
          background: linear-gradient(120deg, #f8fafc 60%, #e0e7ff 100%);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(99,102,241,0.08);
          padding: 32px 18px 32px 18px;
          margin-top: 32px;
        }
        .enhanced-card {
          background: linear-gradient(120deg, #f8fafc 60%, #e0e7ff 100%);
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(99,102,241,0.13);
          padding: 18px 10px 16px 10px;
          min-height: 220px;
          width: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          transition: box-shadow 0.18s, transform 0.12s, border 0.18s, background 0.18s;
          border: 2px solid #e0e7ff;
        }
        .enhanced-card:hover, .enhanced-card:focus {
          box-shadow: 0 12px 36px rgba(99,102,241,0.22);
          transform: translateY(-3px) scale(1.035);
          border: 2px solid #6366f1;
          outline: none;
          background: linear-gradient(120deg, #e0e7ff 60%, #f8fafc 100%);
        }
        .enhanced-thumb {
          width: 100%;
          max-width: 140px;
          height: 140px;
          object-fit: cover;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(99,102,241,0.10);
          margin-bottom: 14px;
          background: #fff;
          border: 1px solid #e0e7ff;
          transition: box-shadow 0.18s, border 0.18s;
        }
        .enhanced-thumb:hover {
          box-shadow: 0 4px 20px rgba(99,102,241,0.18);
          border: 1.5px solid #6366f1;
        }
        .enhanced-file-box {
          width: 100%;
          max-width: 140px;
          height: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 2px 12px rgba(99,102,241,0.10);
          border: 2px solid #e0e7ff;
          padding: 12px 6px 10px 6px;
          margin-bottom: 14px;
          transition: box-shadow 0.18s, border 0.18s;
        }
        .enhanced-file-box:hover {
          box-shadow: 0 4px 20px rgba(99,102,241,0.18);
          border: 2px solid #6366f1;
        }
        .enhanced-file-icon {
          width: 38px;
          height: 38px;
          margin-bottom: 6px;
        }
        .enhanced-file-name {
          font-size: 0.98rem;
          word-break: break-all;
          text-align: center;
          color: var(--primary);
          background: rgba(255,255,255,0.85);
          border-radius: 4px;
          padding: 2px 4px;
          box-shadow: 0 1px 2px #eee;
          margin-bottom: 4px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .enhanced-download-btn {
          margin-top: 6px;
          font-size: 0.95rem;
          color: #6366f1;
          text-decoration: underline;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .enhanced-download-icon {
          width: 16px;
          height: 16px;
        }
        .enhanced-actions {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          gap: 10px;
          width: 100%;
          margin-top: 10px;
          position: absolute;
          left: 0;
          bottom: 10px;
          z-index: 2;
        }
        .enhanced-btn {
          background: #f3f4f6;
          border: none;
          color: #6366f1;
          font-size: 1.18rem;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          opacity: 0.93;
          transition: background 0.16s, color 0.16s, opacity 0.16s, box-shadow 0.16s;
        }
        .enhanced-btn:hover {
          background: #6366f1;
          color: #fff;
          opacity: 1;
          box-shadow: 0 2px 8px rgba(99,102,241,0.13);
        }
        .enhanced-btn:active {
          background: #a5b4fc;
        }
        .enhanced-btn.preview {
          color: #2563eb;
          background: #e0e7ff;
        }
        .enhanced-btn.preview:hover {
          background: #6366f1;
          color: #fff;
        }
        .enhanced-btn.delete {
          color: #ef4444;
          background: #fee2e2;
        }
        .enhanced-btn.delete:hover {
          background: #ef4444;
          color: #fff;
        }
        .enhanced-btn-icon {
          width: 18px;
          height: 18px;
        }
        @media (max-width: 700px) {
          .enhanced-gallery {
            padding: 12px 2px 18px 2px;
            margin-top: 12px;
          }
          .enhanced-card {
            width: 100px;
            min-height: 120px;
            padding: 6px 2px 10px 2px;
            border-radius: 10px;
          }
          .enhanced-thumb, .enhanced-file-box {
            height: 60px;
            width: 60px;
            border-radius: 6px;
            margin-bottom: 6px;
          }
          .enhanced-actions {
            gap: 4px;
            bottom: 4px;
          }
          .enhanced-btn {
            width: 22px;
            height: 22px;
            font-size: 0.95rem;
          }
        }
        @media (max-width: 480px) {
          .enhanced-card {
            width: 70px !important;
            min-height: 70px;
            padding: 2px 0 4px 0;
          }
          .enhanced-thumb, .enhanced-file-box {
            height: 32px;
            width: 32px;
            border-radius: 4px;
            margin-bottom: 2px;
          }
          .enhanced-actions {
            gap: 2px;
            bottom: 2px;
          }
          .enhanced-btn {
            width: 16px;
            height: 16px;
            font-size: 0.7rem;
          }
        }
        :root {
          --bg-gradient: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
          --hero-bg: #fff;
          --text-main: #7a7a9a;
          --border-main: #b6b6d6;
          --primary: #6366f1;
          --primary2: #06b6d4;
          --shadow: 0 6px 32px 0 rgba(80,80,120,0.08);
          --img-bg: #fff;
          --notice-bg: linear-gradient(90deg,#6366f1 0%,#06b6d4 100%);
          --delete-bg: #fff;
          --delete-color: #ef4444;
        }
        body.dark {
          --bg-gradient: linear-gradient(135deg, #232946 0%, #181824 100%);
          --hero-bg: #232946;
          --text-main: #e0e7ff;
          --border-main: #6366f1;
          --primary: #6366f1;
          --primary2: #06b6d4;
          --shadow: 0 6px 32px 0 rgba(80,80,120,0.18);
          --img-bg: #181824;
          --notice-bg: linear-gradient(90deg,#6366f1 0%,#06b6d4 100%);
          --delete-bg: #232946;
          --delete-color: #f87171;
        }
        body {
          font-family: 'Inter', Arial, sans-serif;
          margin: 0;
          min-height: 100vh;
          background: var(--bg-gradient);
          transition: background 0.3s;
        }
        .hero {
          width: 100%;
          min-height: 320px;
          background: var(--hero-bg);
          border: 2.5px dashed var(--border-main);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          margin: 32px auto 32px auto;
          font-size: 1.2rem;
          color: var(--text-main);
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.3s, color 0.3s;
          border-radius: 24px;
          box-shadow: var(--shadow);
          max-width: 600px;
          position: relative;
        }
        .hero.dragover {
          border-color: #6366f1;
          color: #6366f1;
          box-shadow: 0 8px 32px 0 rgba(99,102,241,0.12);
        }
        .hero-icon {
          font-size: 3.5rem;
          margin-bottom: 12px;
          color: #b6b6d6;
          transition: color 0.2s;
          user-select: none;
          pointer-events: none;
        }
        .hero.dragover .hero-icon {
          color: #6366f1;
        }
        .hero-text {
          margin-bottom: 18px;
          font-size: 1.18rem;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .upload-btn {
          background: linear-gradient(90deg, #6366f1 0%, #06b6d4 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 28px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99,102,241,0.08);
          transition: background 0.2s, transform 0.1s;
          margin-bottom: 8px;
        }
        .upload-btn:hover {
          background: linear-gradient(90deg, #6366f1 0%, #2563eb 100%);
          transform: translateY(-2px) scale(1.04);
        }
        .gallery-header {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem 0.5rem 1.5rem;
          background: var(--hero-bg);
          border-bottom: 1.5px solid var(--border-main);
          box-shadow: 0 2px 8px rgba(80,80,120,0.04);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .gallery-header-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin: 32px 0 0 0;
          font-size: 1.08rem;
          letter-spacing: 0.01em;
          opacity: 0.85;
          user-select: none;
        }
        .gallery-header-label {
          color: var(--text-main);
          font-weight: 500;
        }
        .gallery-header-code {
          font-family: monospace;
          color: var(--primary);
          font-size: 1.18rem;
          margin: 0 0.25rem;
          padding: 2px 8px;
          border-radius: 6px;
          background: var(--img-bg);
        }
        .gallery-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--hero-bg);
          color: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 1.1rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99,102,241,0.08);
          transition: background 0.2s, color 0.2s, border 0.2s;
          margin-left: 0.15rem;
          padding: 0;
        }
        .gallery-header-icon:hover {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary2);
        }
        .header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--hero-bg);
          color: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 50%;
          width: 38px;
          height: 38px;
          font-size: 1.2rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99,102,241,0.08);
          transition: background 0.2s, color 0.2s, border 0.2s;
          margin-left: 0.15rem;
          padding: 0;
        }
        .header-btn:hover {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary2);
        }
        .library-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 0 24px 32px 24px;
          justify-content: flex-start;
          margin: 0 auto;
        }
        .library-img {
          height: 150px;
          aspect-ratio: 1/1;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(80,80,120,0.10);
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.1s, border-color 0.2s;
          border: 2.5px solid transparent;
          background: var(--img-bg);
          position: relative;
          z-index: 1;
          user-select: none;
        }
        .library-img.dragging {
          opacity: 0.4;
          z-index: 10;
        }
        .img-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          z-index: 2;
        }
        .img-btn {
          background: var(--delete-bg);
          border: none;
          color: var(--delete-color);
          font-size: 1.1rem;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          opacity: 0.85;
          transition: background 0.2s, color 0.2s, opacity 0.2s;
        }
        .img-btn:hover {
          background: #fee2e2;
          color: #b91c1c;
          opacity: 1;
        }
        .img-btn:active {
          background: #fecaca;
        }
        .img-btn.preview {
          color: var(--primary);
          background: var(--delete-bg);
        }
        .img-btn.preview:hover {
          background: #e0e7ff;
          color: #2563eb;
        }
        .dark-toggle {
          position: fixed;
          top: 18px;
          right: 24px;
          z-index: 1200;
          background: var(--hero-bg);
          color: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99,102,241,0.08);
          transition: background 0.2s, color 0.2s;
        }
        .dark-toggle:hover {
          background: var(--primary);
          color: #fff;
        }
        .modal {
          display: none;
          position: fixed;
          z-index: 2000;
          left: 0; top: 0; width: 100vw; height: 100vh;
          background: rgba(30,41,59,0.65);
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .modal.open {
          display: flex;
        }
        .modal-content {
          background: var(--hero-bg);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(80,80,120,0.18);
          padding: 32px 24px 24px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 90vw;
          max-height: 90vh;
          position: relative;
        }
        .modal-img {
          max-width: 70vw;
          max-height: 60vh;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(80,80,120,0.13);
          margin-bottom: 18px;
          background: var(--img-bg);
        }
        .modal-close {
          position: absolute;
          top: 12px;
          right: 18px;
          font-size: 1.5rem;
          color: var(--primary);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .modal-close:hover {
          color: #ef4444;
        }
        .library-img:hover {
          box-shadow: 0 4px 20px rgba(99,102,241,0.13);
          border-color: #6366f1;
          transform: scale(1.04);
        }
        .library-img:active {
          transform: scale(0.97);
          border-color: #06b6d4;
        }
        .copied {
          outline: 3px solid #06b6d4 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px #a7f3d0 !important;
          z-index: 20 !important;
        }
        @media (max-width: 700px) {
          .gallery-header {
            flex-direction: row;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem 0.5rem 1.5rem;
          }
          .gallery-header-bar {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            margin: 32px 0 0 0;
            font-size: 1.08rem;
            gap: 0.5rem;
            width: auto;
          }
          .gallery-header-label, .gallery-header-code {
            display: inline;
            text-align: left;
            width: auto;
            margin-bottom: 0;
          }
          .gallery-header-code {
            font-size: 1.18rem;
            padding: 2px 8px;
            border-radius: 6px;
            background: var(--img-bg);
            word-break: normal;
          }
          .gallery-header-icon, .header-btn {
            width: 38px;
            height: 38px;
            font-size: 1.2rem;
            border-radius: 50%;
            margin: 0 0.15rem 0 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        @media (max-width: 480px) {
          .img-wrapper {
            width: 70px !important;
          }
          .library-img {
            height: 32px;
          }
          .modal-content {
            padding: 4px 0 4px 0;
          }
          .modal-img {
            max-width: 98vw;
            max-height: 30vh;
          }
          .gallery-header {
            padding: 0.2rem 0.2rem 0.1rem 0.2rem;
          }
        }
      `}</style>
    </>
  );
}
