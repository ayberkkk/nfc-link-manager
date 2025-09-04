import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(req) {
  // Environment variable kontrolü
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Supabase configuration is missing" },
      { status: 503 }
    );
  }

  try {
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
  } catch (err) {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
