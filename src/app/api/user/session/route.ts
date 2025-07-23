import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/user/login: authenticate user and set session cookie
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }
  // TODO: Fetch user from local storage and check password
  // For now, always return error
  return NextResponse.json({ error: 'Session not available in local mode' }, { status: 401 });
}
