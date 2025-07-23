import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// ...existing code...

// Helper to generate a unique 6-digit code
async function generateUniqueCode() {
  let code: string = '000000';
  // TODO: Check for code uniqueness in local storage
  code = Math.floor(100000 + Math.random() * 900000).toString();
  // For now, assume always unique
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
  // If password is empty string or not provided, passwordHash remains null (no password)
  // TODO: Save gallery to local storage
  const createdAt = new Date().toISOString();
  // Save to local storage (to be implemented)
  return NextResponse.json({ code, createdAt });
}

// GET /api/gallery: list all galleries
export async function GET() {
  // TODO: Fetch galleries from local storage
  const galleries = [];
  return NextResponse.json(galleries);
}
