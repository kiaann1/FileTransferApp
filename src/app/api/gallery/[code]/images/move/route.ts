import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/gallery/[code]/images/move
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params;
    const { newCode } = await req.json();
    // Move all images to new gallery code
    await prisma.image.updateMany({
      where: { code },
      data: { code: newCode },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
