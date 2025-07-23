import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to generate a unique 6-digit code
type GenerateCodeFn = () => Promise<string>;
const generateUniqueCode: GenerateCodeFn = async () => {
  let code: string = '000000';
  let exists = true;
  while (exists) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    exists = !!(await prisma.gallery.findUnique({ where: { code } }));
  }
  return code;
};

// POST /api/gallery/[code]/regenerate: generate a new code for a gallery
export async function POST(req: NextRequest, context: { params: { code: string } }) {
  try {
    const { code } = context.params;
    // Find the gallery
    const gallery = await prisma.gallery.findUnique({ where: { code } });
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }
    // Generate a new unique code
    const newCode = await generateUniqueCode();
    // Update the gallery code
    await prisma.gallery.update({ where: { code }, data: { code: newCode } });
    return NextResponse.json({ success: true, newCode });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
