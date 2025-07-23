// GET /api/gallery/[code]: return if gallery requires a password
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
  const { code } = context.params;
  const gallery = await prisma.gallery.findUnique({ where: { code }, select: { passwordHash: true } });
  if (!gallery) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  return NextResponse.json({ requiresPassword: !!gallery.passwordHash });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/gallery/[code]: delete gallery, all images, and (future) users
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
  const { code } = context.params;
  // Delete all images for this gallery
  await prisma.image.deleteMany({ where: { code } });
  // Delete the gallery
  await prisma.gallery.delete({ where: { code } });
  // TODO: Delete all users with this code (if/when user system is added)
  return NextResponse.json({ success: true });
}
