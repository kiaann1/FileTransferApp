import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// Helper to generate a unique 6-digit code
async function generateUniqueCode() {
  let code: string = '000000';
  let exists = true;
  while (exists) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    exists = !!(await prisma.gallery.findUnique({ where: { code } }));
  }
  return code;
}

// POST /api/gallery: create a new gallery with a unique code and optional password
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const code = await generateUniqueCode();
  let passwordHash = null;
  if (password && password.length > 0) {
    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }
    passwordHash = await bcrypt.hash(password, 10);
  }
  const gallery = await prisma.gallery.create({ data: { code, passwordHash } });
  return NextResponse.json({ code, createdAt: gallery.createdAt });
}

// GET /api/gallery: list all galleries
export async function GET() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(galleries);
}
