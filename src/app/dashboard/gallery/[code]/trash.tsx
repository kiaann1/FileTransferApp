"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  deleted?: boolean;
};

export default function TrashPage() {
  const router = useRouter();
  const { code } = useParams();
  const [gallery, setGallery] = useState<{ id: string; name: string; code: string } | null>(null);
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      const { data: galleryData, error } = await supabase
        .from("galleries")
        .select("id, name, code")
        .eq("code", code)
        .single();
      if (error || !galleryData) {
        router.replace("/dashboard");
        return;
      }
      setGallery(galleryData);
      setLoading(false);
    }
    if (code) fetchGallery();
  }, [code, router]);

  useEffect(() => {
    async function fetchFiles() {
      if (!gallery) return;
      const { data: filesData, error } = await supabase
        .from("gallery_files")
        .select("*")
        .eq("gallery_id", gallery.id)
        .eq("deleted", true);
      if (error) {
        toast("Error fetching trashed files", { type: "error" });
      }
      setFiles(filesData || []);
    }
    if (gallery) fetchFiles();
  }, [gallery]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-xl">Loading Trash...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col items-center py-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-3xl font-bold text-red-600 mb-8">Trash</h1>
      <div className="bg-white rounded-2xl shadow p-4 md:p-8 overflow-x-auto w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 md:mb-6">
          <div className="text-xl font-bold text-red-600">Trashed Files <span className="text-xs text-[#6c63ff] font-semibold ml-2">{files.length} Deleted</span></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.length === 0 ? (
            <div className="col-span-4 text-gray-400 text-center py-12 text-lg">Trash is empty.</div>
          ) : (
            files.map(file => (
              <div
                key={file.id}
                className="bg-[#ffeaea] rounded-2xl shadow p-4 flex flex-col items-center justify-start relative border border-[#ff4d4f]"
              >
                <span className="font-semibold text-gray-900 text-base text-center break-words w-full">{file.name}</span>
                <span className="text-gray-700 text-sm">{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '--'}</span>
                <span className="text-gray-700 text-sm">{file.uploader_username || '--'}</span>
                <div className="flex gap-4 items-center justify-center w-full mt-2">
                  <button className="text-green-600 hover:bg-green-100 p-2 rounded-full" title="Restore" onClick={async () => {
                    await supabase.from('gallery_files').update({ deleted: false }).eq('id', file.id);
                    toast('File restored!', { type: 'success' });
                    setFiles(files.filter(f => f.id !== file.id));
                  }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 19V6M5 12l7-7 7 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <button className="text-[#ff4d4f] hover:bg-[#ffeaea] p-2 rounded-full" title="Delete Permanently" onClick={async () => {
                    const urlParts = file.url?.split('/');
                    const filePath = urlParts.slice(urlParts.length - 2).join('/');
                    await supabase.storage.from('gallery-files').remove([filePath]);
                    await supabase.from('gallery_files').delete().eq('id', file.id);
                    toast('File permanently deleted.', { type: 'success' });
                    setFiles(files.filter(f => f.id !== file.id));
                  }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="#ff4d4f" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
