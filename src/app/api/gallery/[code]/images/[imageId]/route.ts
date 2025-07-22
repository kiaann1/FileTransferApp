import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// DELETE /api/gallery/[code]/images/[imageId]: delete an image
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
  const { code, imageId } = context.params;
  const image = await prisma.image.findUnique({ where: { id: Number(imageId) } });
  if (!image || image.code !== code) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
  // Delete file from filesystem
  const filepath = path.join(UPLOAD_DIR, image.filename);
  await fs.unlink(filepath).catch(() => {}); // Ignore if file missing
  // Delete from DB
  await prisma.image.delete({ where: { id: Number(imageId) } });
  return NextResponse.json({ success: true });
}
