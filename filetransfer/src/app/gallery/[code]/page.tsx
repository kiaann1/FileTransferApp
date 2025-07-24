import { supabase } from "@/lib/supabaseClient";
import { redirect } from "next/navigation";

export default async function GalleryPage({ params }: { params: { code: string } }) {
  // Example: fetch gallery by code
  const { data: gallery } = await supabase
    .from("Gallery")
    .select("*")
    .eq("code", params.code)
    .single();
  if (!gallery) redirect("/dashboard");

  // Fetch files, folders, etc. here
  // ...

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gallery {params.code}</h1>
      {/* Gallery workspace UI will go here */}
    </div>
  );
}
