import { supabase } from "@/lib/supabaseClient";
import { generateSecret, verifyToken, generateOtpAuthUri, generateQRCode, generateRecoveryCodes } from "@/lib/twoFactorAuth";

// 2FA ayarla
export async function POST(req) {
  // Environment variable kontrolü
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json(
      { error: "Supabase configuration is missing" },
      { status: 503 }
    );
  }

  try {
    const { userId, email } = await req.json();
    
    // 2FA için gizli anahtar oluştur
    const secret = generateSecret();
    
    // Kurtarma kodları oluştur
    const recoveryCodes = generateRecoveryCodes();
    
    // OTP Auth URI'si oluştur
    const otpAuthUri = generateOtpAuthUri(email, 'NFC Link Manager', secret);
    
    // QR kodu oluştur
    const qrCodeDataUrl = await generateQRCode(otpAuthUri);
    
    // Kullanıcının 2FA bilgilerini güncelle
    const { error } = await supabase
      .from("user_2fa")
      .insert([{
        user_id: userId,
        secret: secret,
        is_enabled: false,  // Kullanıcı doğrulamayı tamamladıktan sonra true olacak
        recovery_codes: recoveryCodes
      }]);
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      qrCode: qrCodeDataUrl,
      recoveryCodes: recoveryCodes
    });
  } catch (err) {
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// 2FA doğrulama
export async function PUT(req) {
  try {
    const { userId, token } = await req.json();
    
    // Kullanıcının 2FA bilgilerini al
    const { data, error } = await supabase
      .from("user_2fa")
      .select("secret")
      .eq("user_id", userId)
      .single();
    
    if (error || !data) {
      return Response.json({ error: "2FA bilgisi bulunamadı" }, { status: 404 });
    }
    
    // Token'ı doğrula
    const isValid = verifyToken(token, data.secret);
    
    if (!isValid) {
      return Response.json({ error: "Geçersiz kod" }, { status: 401 });
    }
    
    // 2FA'yı etkinleştir
    await supabase
      .from("user_2fa")
      .update({ is_enabled: true })
      .eq("user_id", userId);
    
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// Kurtarma kodu doğrulama
export async function PATCH(req) {
  try {
    const { userId, recoveryCode } = await req.json();
    
    // Kullanıcının 2FA bilgilerini al
    const { data, error } = await supabase
      .from("user_2fa")
      .select("recovery_codes")
      .eq("user_id", userId)
      .single();
    
    if (error || !data) {
      return Response.json({ error: "2FA bilgisi bulunamadı" }, { status: 404 });
    }
    
    // Kurtarma kodunu kontrol et
    const recoveryCodesArray = data.recovery_codes;
    const recoveryCodeIndex = recoveryCodesArray.indexOf(recoveryCode);
    
    if (recoveryCodeIndex === -1) {
      return Response.json({ error: "Geçersiz kurtarma kodu" }, { status: 401 });
    }
    
    // Kullanılan kurtarma kodunu kaldır
    recoveryCodesArray.splice(recoveryCodeIndex, 1);
    
    // Veritabanını güncelle
    await supabase
      .from("user_2fa")
      .update({ recovery_codes: recoveryCodesArray })
      .eq("user_id", userId);
    
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}