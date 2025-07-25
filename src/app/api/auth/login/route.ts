import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";
import jwt from "jsonwebtoken";

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Get user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, password, username")
    .eq("email", email)
    .single();
  if (userError || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  // Compare password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  // Create JWT token
  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET || "changeme", { expiresIn: "7d" });
  // Set httpOnly cookie
  const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username, email: user.email } }, { status: 200 });
  response.cookies.set({
    name: "session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  return response;
}
