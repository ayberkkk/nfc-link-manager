import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/twoFactorAuth";

export async function POST(req) {
  // Environment variable kontrolü
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Supabase configuration is missing" },
      { status: 503 }
    );
  }

  try {
    const { email, password, otpToken } = await req.json();

    // Giriş denemelerini kontrol et ve rate limiting uygula
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Son 10 dakika içindeki başarısız giriş denemelerini kontrol et
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    const { count } = await supabase
      .from("login_attempts")
      .select("*", { count: "exact" })
      .eq("ip_address", ipAddress)
      .eq("success", false)
      .gte("created_at", tenMinutesAgo.toISOString());
    
    // Çok fazla başarısız deneme varsa bloklama
    if (count && count > 5) {
      // Giriş denemesini kaydet
      await supabase.from("login_attempts").insert([{
        email,
        ip_address: ipAddress,
        success: false,
        blocked: true
      }]);
      
      return Response.json({ 
        error: "Çok fazla başarısız deneme. Lütfen 10 dakika sonra tekrar deneyin.",
        rateLimited: true 
      }, { status: 429 });
    }

    // Kullanıcıyı bul
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      // Başarısız giriş denemesini kaydet
      await supabase.from("login_attempts").insert([{
        email,
        ip_address: ipAddress,
        success: false
      }]);
      
      return Response.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
    }

    // Şifre doğrulaması
    const isValid = await bcrypt.compare(password, data.password_hash);
    if (!isValid) {
      // Başarısız giriş denemesini kaydet
      await supabase.from("login_attempts").insert([{
        email,
        ip_address: ipAddress,
        user_id: data.id,
        success: false
      }]);
      
      return Response.json({ error: "Geçersiz şifre" }, { status: 401 });
    }

    // 2FA kontrol et
    const { data: twoFactorData } = await supabase
      .from("user_2fa")
      .select("*")
      .eq("user_id", data.id)
      .single();

    // 2FA etkinleştirilmişse token kontrol et
    if (twoFactorData && twoFactorData.is_enabled) {
      // OTP token verilmemişse, 2FA gerektiğini bildir
      if (!otpToken) {
        return Response.json({ 
          requires2FA: true,
          user: { 
            id: data.id,
            name: data.name,
            email: data.email
          }
        });
      }

      // OTP token doğrulama
      const isValidToken = verifyToken(otpToken, twoFactorData.secret);
      if (!isValidToken) {
        // Başarısız giriş denemesini kaydet
        await supabase.from("login_attempts").insert([{
          email,
          ip_address: ipAddress,
          user_id: data.id,
          success: false,
          twofa_failed: true
        }]);
        
        return Response.json({ error: "Geçersiz doğrulama kodu" }, { status: 401 });
      }
    }

    // Başarılı giriş denemesini kaydet
    await supabase.from("login_attempts").insert([{
      email,
      ip_address: ipAddress,
      user_id: data.id,
      success: true
    }]);

    // Kullanıcı arayüzü için gerekli bilgileri döndür
    return Response.json({ 
      success: true, 
      user: { 
        id: data.id, 
        name: data.name, 
        email: data.email,
        has2fa: twoFactorData && twoFactorData.is_enabled
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
