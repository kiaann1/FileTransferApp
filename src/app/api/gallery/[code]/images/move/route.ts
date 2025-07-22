import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/gallery/[code]/images/move
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, context: any) {
  const { code } = context.params;
  const { newCode } = await req.json();
  // Move all images to new gallery code
  await prisma.image.updateMany({
    where: { code },
    data: { code: newCode },
  });
  return NextResponse.json({ success: true });
}
