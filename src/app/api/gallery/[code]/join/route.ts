import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/gallery/[code]/join
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params;
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });
  const gallery = await prisma.gallery.findUnique({ where: { code }, select: { passwordHash: true } });
  if (!gallery || !gallery.passwordHash) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  const valid = await bcrypt.compare(password, gallery.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  // TODO: Add user to gallery user list (future)
  return NextResponse.json({ success: true });
}
