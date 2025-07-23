// GET /api/gallery/[code]: return if gallery requires a password
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
  const { code } = context.params;
  // TODO: Fetch gallery from local storage
  // For now, always return false
  return NextResponse.json({ requiresPassword: false });
}
import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// DELETE /api/gallery/[code]: delete gallery, all images, and (future) users
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
  const { code } = context.params;
  // TODO: Delete all images and gallery from local storage
  return NextResponse.json({ success: true });
}
