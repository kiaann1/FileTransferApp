import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const { username, email, password } = await req.json();
  if (!username || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Check if user exists
  const { data: existingUser, error: userCheckError } = await supabase
    .from("users")
    .select("id")
    .or(`email.eq.${email},username.eq.${username}`)
    .single();
  if (userCheckError && userCheckError.code !== "PGRST116") {
    return NextResponse.json({ error: userCheckError.message }, { status: 500 });
  }
  if (existingUser) {
    return NextResponse.json({ error: "Email or username already registered." }, { status: 409 });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("[SIGNUP] username:", username, "email:", email, "password:", password, "hashed:", hashedPassword);
  // Insert user
  const { error: insertError } = await supabase
    .from("users")
    .insert([{ username, email, password: hashedPassword }]);
  if (insertError) {
    console.error("[SIGNUP] Insert error:", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  console.log("[SIGNUP] User created successfully");
  return NextResponse.json({ success: true }, { status: 201 });
}
