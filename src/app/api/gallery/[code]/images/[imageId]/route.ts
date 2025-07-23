import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// DELETE /api/gallery/[code]/images/[imageId]: delete an image
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
  const { code, imageId } = context.params;
  // TODO: Fetch image from local storage and delete file
  // For now, always return success
  return NextResponse.json({ success: true });
}
