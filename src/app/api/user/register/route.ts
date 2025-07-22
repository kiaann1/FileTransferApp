import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/user/register: create a new user with username and password
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password || password.length < 4) {
    return NextResponse.json({ error: 'Username and password (min 4 chars) required' }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, passwordHash } });
  // Optionally, set a session cookie here
  return NextResponse.json({ userId: user.id, username: user.username, createdAt: user.createdAt });
}
