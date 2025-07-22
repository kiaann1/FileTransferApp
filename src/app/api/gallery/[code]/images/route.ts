import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// GET /api/gallery/[code]/images: fetch all images for a gallery
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
  try {
    const { code } = context.params;
    const images = await prisma.image.findMany({
      where: { code },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(images);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

// POST /api/gallery/[code]/images: upload a file (image or any file type)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, context: any) {
  try {
    const { code } = context.params;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = path.extname(file.name) || '';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, buffer);

    // Save file metadata (not just images)
    const uploadedFile = await prisma.image.create({
      data: { code, filename },
    });
    return NextResponse.json(uploadedFile);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
