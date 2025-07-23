import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/gallery/[code]/images/move
export async function POST(req: NextRequest, context: { params: { code: string } }) {
  try {
    const { code } = context.params;
    const { newCode } = await req.json();
    // Move all images to new gallery code
    await prisma.image.updateMany({
      where: { code },
      data: { code: newCode },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
      message = (error as any).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
