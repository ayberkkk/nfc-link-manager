import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { email, password } = await req.json();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    return Response.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, data.password_hash);
  if (!isValid) {
    return Response.json({ error: "Geçersiz şifre" }, { status: 401 });
  }

  return Response.json({ success: true, user: { id: data.id, name: data.name, email: data.email } });
}
