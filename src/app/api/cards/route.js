import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("cards")
    .select("id, uid, link, user_id, users(name, email)");
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data);
}

export async function POST(req) {
  const { uid, link, user_id } = await req.json();
  const { data, error } = await supabase
    .from("cards")
    .insert([{ uid, link, user_id }])
    .select();
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json({ success: true });
}
