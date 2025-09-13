import { supabase } from "@/lib/supabaseClient";
import crypto from 'crypto';

// Güvenilir cihaz oluştur
export async function POST(req) {
  try {
    const { userId, deviceName, rememberDays = 30 } = await req.json();
    
    // Cihaz ID'si oluştur
    const deviceId = crypto.randomUUID();
    
    // Cihazın sona erme tarihini hesapla
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rememberDays);
    
    // IP adresini al
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // User agent bilgisini al
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Cihazı veritabanına ekle
    const { error } = await supabase
      .from("trusted_devices")
      .insert([{
        user_id: userId,
        device_id: deviceId,
        device_name: deviceName || userAgent,
        ip_address: ipAddress,
        expires_at: expiresAt.toISOString()
      }]);
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    // Denetim günlüğüne ekle
    await supabase.from("audit_logs").insert([{
      user_id: userId,
      action: 'add_trusted_device',
      entity: 'trusted_devices',
      details: { device_name: deviceName, device_id: deviceId },
      ip_address: ipAddress,
      user_agent: userAgent
    }]);
    
    return Response.json({
      success: true,
      deviceId
    });
  } catch (err) {
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// Kullanıcının güvenilir cihazlarını getir
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Güvenilir cihazları getir
    const { data, error } = await supabase
      .from("trusted_devices")
      .select("*")
      .eq("user_id", userId)
      .order('last_used_at', { ascending: false });
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json({ devices: data });
  } catch (err) {
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// Cihazı doğrula
export async function PUT(req) {
  try {
    const { userId, deviceId } = await req.json();
    
    // Güvenilir cihazı ara
    const { data, error } = await supabase
      .from("trusted_devices")
      .select("*")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .gte("expires_at", new Date().toISOString())
      .single();
    
    if (error || !data) {
      return Response.json({ valid: false });
    }
    
    // Cihazın son kullanma tarihini güncelle
    await supabase
      .from("trusted_devices")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);
    
    return Response.json({ valid: true });
  } catch (err) {
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// Cihazı sil
export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const deviceId = url.searchParams.get('deviceId');
    
    if (!userId || !deviceId) {
      return Response.json({ error: "User ID and Device ID are required" }, { status: 400 });
    }
    
    // Cihazı sil
    const { error } = await supabase
      .from("trusted_devices")
      .delete()
      .eq("user_id", userId)
      .eq("device_id", deviceId);
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    // IP adresini al
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // User agent bilgisini al
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Denetim günlüğüne ekle
    await supabase.from("audit_logs").insert([{
      user_id: userId,
      action: 'remove_trusted_device',
      entity: 'trusted_devices',
      entity_id: deviceId,
      ip_address: ipAddress,
      user_agent: userAgent
    }]);
    
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}