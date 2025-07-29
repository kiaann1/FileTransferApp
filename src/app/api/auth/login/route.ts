
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
// Supabase should not be used server-side in API routes
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Only allow POST requests; return 405 for all others
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function OPTIONS() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
