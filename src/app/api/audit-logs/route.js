import { supabase } from "@/lib/supabaseClient";

// Denetim kayıtlarını getir
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const entity = url.searchParams.get('entity');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Admin yetkisi kontrolü burada yapılmalı
    // Örnek olarak tüm kullanıcıların kayıtları erişilebilir yapıldı
    
    let query = supabase
      .from("audit_logs")
      .select("*, users(name, email)", { count: "exact" });
    
    // Filtreleri uygula
    if (userId) query = query.eq("user_id", userId);
    if (action) query = query.eq("action", action);
    if (entity) query = query.eq("entity", entity);
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
    
    // Sayfalama
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json({
      logs: data,
      total: count,
      limit,
      offset
    });
  } catch (err) {
    console.error("Audit logs error:", err);
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// Yeni bir denetim kaydı ekle
export async function POST(req) {
  try {
    const { userId, action, entity, entityId, details } = await req.json();
    
    // IP adresini al
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // User agent bilgisini al
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Denetim kaydını ekle
    const { error } = await supabase.from("audit_logs").insert([{
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    }]);
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json({ success: true });
  } catch (err) {
    console.error("Add audit log error:", err);
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}