import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  console.log("[LOGIN] Incoming email:", email);
  if (!email || !password) {
    console.log("[LOGIN] Missing fields:", { email, password });
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Try both 'users' and 'auth.users' tables for flexibility
  let user = null;
  let userError = null;
  let triedTable = "users";
  let result = await supabase
    .from("users")
    .select("id, email, password, username")
    .eq("email", email)
    .single();
  user = result.data;
  userError = result.error;
  if (!user) {
    triedTable = "auth.users";
    result = await supabase
      .from("auth.users")
      .select("id, email, encrypted_password as password, raw_user_meta_data as username")
      .eq("email", email)
      .single();
    user = result.data;
    userError = result.error;
  }
  console.log("[LOGIN] Supabase query result:", { user, userError, triedTable });
  if (userError || !user) {
    console.error("[LOGIN] User not found or error:", { userError, user, triedTable });
    return NextResponse.json({ error: "User not found.", debug: { email, userError, user, triedTable } }, { status: 404 });
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
        user: user
      }
    }, { status: 200 });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    return response;
  } else {
    return NextResponse.json({ success: false, error: "User not found after login." }, { status: 401 });
  }
}
