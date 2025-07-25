
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";
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

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  console.log("[LOGIN] Incoming email:", normalizedEmail);
  if (!normalizedEmail || !password) {
    console.log("[LOGIN] Missing fields:", { normalizedEmail, password });
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Query only the 'users' table, case-insensitive
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, password, username")
    .eq("email", normalizedEmail)
    .single();
  console.log("[LOGIN] Supabase query result:", { user, userError });
  if (userError || !user) {
    console.error("[LOGIN] User not found or error:", { userError, user });
    return NextResponse.json({ error: "User not found.", debug: { normalizedEmail, userError, user } }, { status: 404 });
  }
  // Compare password
  console.log("[LOGIN] Comparing password:", password, "with hash:", user.password);
  const passwordMatch = await bcrypt.compare(password, user.password);
  console.log("[LOGIN] Password match:", passwordMatch);
  if (!passwordMatch) {
    console.error("[LOGIN] Incorrect password for email:", email);
    return NextResponse.json({
      error: "Incorrect password.",
      debug: {
        attemptedPassword: password,
        storedHash: user.password,
        bcryptCompareResult: passwordMatch,
        user: user
      }
    }, { status: 401 });
  }
  // Only proceed if user is not null
  if (user) {
    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET || "changeme", { expiresIn: "7d" });
    // Set httpOnly cookie using Next.js cookies API
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
      debug: {
        attemptedPassword: password,
        storedHash: user.password,
        bcryptCompareResult: passwordMatch,
        user: user,
        cookieSet: true
      }
    }, { status: 200 });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    console.log("[LOGIN] Session cookie set for user:", user.email);
    return response;
  } else {
    return NextResponse.json({ success: false, error: "User not found after login." }, { status: 401 });
  }
}
