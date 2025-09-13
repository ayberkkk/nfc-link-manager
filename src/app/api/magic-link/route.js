import { supabase } from "@/lib/supabaseClient";
import crypto from 'crypto';

// Sihirli bağlantı (magic link) oluşturma
export async function POST(req) {
  try {
    const { email } = await req.json();
    
    // Kullanıcıyı e-posta adresine göre bul
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .single();
    
    if (userError) {
      return Response.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }
    
    // Benzersiz bir token oluştur
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 saat geçerli
    
    // Token'ı veritabanına kaydet
    await supabase
      .from("magic_links")
      .insert([{
        user_id: user.id,
        token: token,
        used: false,
        expires_at: expiresAt.toISOString()
      }]);
    
    // E-posta gönderimi normalde burada yapılır
    // Gerçek projelerde bir e-posta servisi kullanılmalıdır (SendGrid, AWS SES vb.)
    
    // IP adresini al
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Denetim günlüğüne ekle
    await supabase.from("audit_logs").insert([{
      user_id: user.id,
      action: 'magic_link_created',
      entity: 'magic_links',
      details: { email: user.email },
      ip_address: ipAddress
    }]);
    
    // Geliştirme amaçlı olarak token'ı döndür (gerçek uygulamada bu yapılmamalı)
    return Response.json({
      success: true,
      // Development only
      magicLink: `${process.env.NEXT_PUBLIC_APP_URL}/magic-login?token=${token}`
    });
  } catch (err) {
    console.error("Magic link error:", err);
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// Sihirli bağlantı ile giriş yapma
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return Response.json({ error: "Token is required" }, { status: 400 });
    }
    
    // Token'ı kontrol et
    const { data, error } = await supabase
      .from("magic_links")
      .select("*, users(id, name, email)")
      .eq("token", token)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .single();
    
    if (error || !data) {
      return Response.json({ error: "Geçersiz veya süresi dolmuş token" }, { status: 401 });
    }
    
    // Token'ı kullanıldı olarak işaretle
    await supabase
      .from("magic_links")
      .update({ used: true })
      .eq("token", token);
    
    // IP adresini al
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Giriş denemesini kaydet
    await supabase.from("login_attempts").insert([{
      email: data.users.email,
      ip_address: ipAddress,
      user_id: data.users.id,
      success: true,
      user_agent: req.headers.get('user-agent') || 'unknown'
    }]);
    
    // Denetim günlüğüne ekle
    await supabase.from("audit_logs").insert([{
      user_id: data.users.id,
      action: 'magic_link_login',
      entity: 'users',
      ip_address: ipAddress,
      user_agent: req.headers.get('user-agent') || 'unknown'
    }]);
    
    return Response.json({ 
      success: true, 
      user: {
        id: data.users.id,
        name: data.users.name,
        email: data.users.email
      }
    });
  } catch (err) {
    console.error("Magic link verification error:", err);
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}