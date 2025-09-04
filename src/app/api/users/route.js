import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function GET() {
  const { data, error } = await supabase.from("users").select("id, name, email, created_at");
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data);
}

export async function POST(req) {
  const { name, email, password } = await req.json();
  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password_hash }])
    .select("id, name, email");

  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data, { status: 201 });
}
