import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/user/register: create a new user with username and password
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password || password.length < 4) {
    return NextResponse.json({ error: 'Username and password (min 4 chars) required' }, { status: 400 });
  }
  // TODO: Check for existing user and save new user to local storage
  // For now, always return error
  return NextResponse.json({ error: 'Registration disabled in local mode' }, { status: 400 });
}
