import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { success: false, message: "Açık oturum bulunamadı" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      patientId,
      clinicId,
      recordType,
      recordDate,
      title,
      description,
      price,
      cost,
    } = body;

    // Temel Validasyon
    if (!patientId || !clinicId || !recordType || !title) {
      return NextResponse.json(
        { success: false, message: "Eksik alanlar var" },
        { status: 400 }
      );
    }

    // Kullanıcı ve Yetki Kontrolü
    const { data: appUser, error: userError } = await supabase
      .from("users")
      .select("id, clinic_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!appUser || userError || appUser.clinic_id !== clinicId) {
      return NextResponse.json(
        { success: false, message: "Yetkisiz işlem" },
        { status: 403 }
      );
    }

    const { data: newRecord, error: insertError } = await supabaseAdmin
      .from("patient_records")
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        record_type: recordType,
        record_date: recordDate
          ? recordDate.replace("Z", "")
          : new Date().toLocaleString("sv-SE").replace(" ", "T"),
        title: title.trim(),
        description: description?.trim() || null,
        price: price || null,
        cost: cost || null,
        created_by: appUser.id,
        doctor_id: appUser.id,
      })
      .select(
        `
        id, 
        record_date, 
        title, 
        record_type, 
        price, 
        description, 
        cost, 
        patient_id,
        patients (name)
      `
      )
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, message: insertError.message },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("activity_logs").insert({
      clinic_id: clinicId,
      user_id: appUser.id,
      entity: "patient_records",
      entity_id: newRecord.id,
      action_type: "CREATE",
      metadata: {
        title: newRecord.title,
        patient_id: patientId,
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newRecord, // Artık içinde hasta ismi de var!
        message: "Kayıt başarıyla oluşturuldu",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("API Hatası:", err);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
