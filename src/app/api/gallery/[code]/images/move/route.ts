import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/gallery/[code]/images/move
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, context: any) {
  try {
    const { code } = context.params;
    const { newCode } = await req.json();
    // Move all images to new gallery code
    await prisma.image.updateMany({
      where: { code },
      data: { code: newCode },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
