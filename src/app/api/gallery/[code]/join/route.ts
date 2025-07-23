import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// POST /api/gallery/[code]/join
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, context: any) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session_user_id')?.value;
  const { code } = context.params;
  const { password } = await req.json();
  // TODO: Fetch gallery from local storage and check password if needed
  // For now, always allow join as viewer
  return NextResponse.json({ success: true, role: 'viewer' });
}
