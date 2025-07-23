import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/user: generate a new user ID and create a user
export async function POST() {
  // Generate a new user with a UUID
  const user = await prisma.user.create({ data: {} });
  return NextResponse.json({ userId: user.id, createdAt: user.createdAt });
}
