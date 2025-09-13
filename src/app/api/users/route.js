/* eslint-disable @typescript-eslint/no-unused-vars */
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function GET() {
  // Environment variable kontrolü
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Supabase configuration is missing" },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase.from("users").select("id, name, email, created_at");
    if (error) return Response.json({ error }, { status: 500 });
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  // Environment variable kontrolü
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Supabase configuration is missing" },
      { status: 503 }
    );
  }

  try {
    const { name, email, password } = await req.json();
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password_hash }])
      .select("id, name, email");

    if (error) return Response.json({ error }, { status: 500 });
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
