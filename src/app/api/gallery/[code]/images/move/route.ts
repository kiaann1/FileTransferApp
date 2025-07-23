import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// POST /api/gallery/[code]/images/move
export async function POST(req: NextRequest) {
  const code = req.nextUrl.pathname.split("/")[4]; // or use URLPattern if needed
  try {
    const { newCode } = await req.json();
    // Move all images to new gallery code
    // TODO: Move all images to new gallery code in local storage
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
