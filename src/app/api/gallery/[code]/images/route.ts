import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// GET /api/gallery/[code]/images: fetch all images for a gallery
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params;
  const images = await prisma.image.findMany({
    where: { code },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(images);
}

// POST /api/gallery/[code]/images: upload an image
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params;
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = path.extname(file.name) || '.png';
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, buffer);

  const image = await prisma.image.create({
    data: { code, filename },
  });
  return NextResponse.json(image);
}
