import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// POST /api/gallery/[code]/join
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, context: any) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session_user_id')?.value;
  const { code } = context.params;
  const { password } = await req.json();
  const gallery = await prisma.gallery.findUnique({ where: { code }, select: { passwordHash: true } });
  if (!gallery) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  if (gallery.passwordHash) {
    // Password-protected: require authentication
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });
    const valid = await bcrypt.compare(password, gallery.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    // Assign viewer role to joiner
    await prisma.galleryRole.create({
      data: {
        galleryCode: code,
        userId,
        role: 'viewer',
      },
    });
    return NextResponse.json({ success: true, role: 'viewer' });
  } else {
    // No password: allow anonymous join (no userId required)
    return NextResponse.json({ success: true, role: 'viewer' });
  }
}
