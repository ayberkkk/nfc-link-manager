/* eslint-disable @typescript-eslint/no-unused-vars */
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  // Environment variable kontrolü
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Supabase configuration is missing" },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("cards")
      .select("id, uid, link, user_id, users(name, email)");
    if (error) return Response.json({ error }, { status: 500 });
    return Response.json(data);
  } catch (_) {
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
    const { uid, link, user_id } = await req.json();
    const { data, error } = await supabase
      .from("cards")
      .insert([{ uid, link, user_id }])
      .select();
    if (error) return Response.json({ error }, { status: 500 });
    return Response.json(data, { status: 201 });
  } catch (_) {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  // Environment variable kontrolü
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Supabase configuration is missing" },
      { status: 503 }
    );
  }

  try {
    const { id } = await req.json();
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) return Response.json({ error }, { status: 500 });
    return Response.json({ success: true });
  } catch (_) {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
