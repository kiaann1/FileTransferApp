import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

// GET /api/gallery/[code]/images: fetch all images for a gallery
export async function GET(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/");
    // /api/gallery/[code]/images => ['', 'api', 'gallery', '{code}', 'images']
    const code = segments[3];
    // TODO: Fetch images from local storage
    const images = [];
    return NextResponse.json(images);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}

// POST /api/gallery/[code]/images: upload a file (image or any file type)
export async function POST(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/");
    // /api/gallery/[code]/images => ['', 'api', 'gallery', '{code}', 'images']
    const code = segments[3];
    // Check if gallery exists
    // TODO: Check if gallery exists in local storage
    // For now, assume gallery exists
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    // Upload to Vercel Blob
    const blob = await put(file.name, file, { access: 'public' });

    // Save file metadata (URL) in the database
    // TODO: Save file metadata to local storage
    const uploadedFile = { code, filename: blob.url, createdAt: new Date().toISOString() };
    return NextResponse.json(uploadedFile);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
