import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
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
  // TODO: Set secure httpOnly cookie/session here
  return NextResponse.json({ success: true, user: { id: user.id, username: user.username, email: user.email } }, { status: 200 });
}
