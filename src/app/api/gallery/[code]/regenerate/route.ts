import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// Helper to generate a unique 6-digit code
type GenerateCodeFn = () => Promise<string>;
const generateUniqueCode: GenerateCodeFn = async () => {
  let code: string = '000000';
  // TODO: Check for code uniqueness in local storage
  code = Math.floor(100000 + Math.random() * 900000).toString();
  // For now, assume always unique
  return code;
};

// POST /api/gallery/[code]/regenerate: generate a new code for a gallery
export async function POST(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/");
    // /api/gallery/[code]/regenerate => ['', 'api', 'gallery', '{code}', 'regenerate']
    const code = segments[3];
    // Find the gallery
    // TODO: Fetch gallery from local storage, generate new code, and update
    // For now, just return a new code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    return NextResponse.json({ success: true, newCode });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
