import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/gallery/[code]/roles: assign a user to a gallery with a role
export async function POST(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/");
  const code = segments[3];
  const { userId, role } = await req.json();
  const galleryRole = await prisma.galleryRole.create({
    data: { galleryCode: code, userId, role }
  });
  return NextResponse.json(galleryRole);
}
