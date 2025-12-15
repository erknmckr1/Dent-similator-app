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

    if (!patientId || !clinicId || !recordType || !title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Zorunlu alanlar eksik: patientId, clinicId, recordType, title",
        },
        { status: 400 }
      );
    }

    const validasyonTypes = ["TREATMENT", "PAYMENT", "NOTE"];
    if (!validasyonTypes.includes(recordType)) {
      return NextResponse.json(
        { success: false, message: "Geçersiz kayıt tipi" },
        { status: 400 }
      );
    }

    // Auth user'dan users tablosundaki kaydı bul
    const { data: appUser, error: userError } = await supabase
      .from("users")
      .select("id, clinic_id, role, name")
      .eq("auth_user_id", user.id)
      .single();

    if (!appUser || userError) {
      console.error("Kullanıcı bulunamadı:", userError);
      return NextResponse.json(
        { success: false, message: "Kullanıcı kaydı bulunamadı." },
        { status: 404 }
      );
    }

    // İsteği atan kullanıcının klinik yetkisi var mı kontrol et
    if (appUser.clinic_id !== clinicId) {
      return NextResponse.json(
        { success: false, message: "Bu kliniğe erişim yetkiniz yoktur." },
        { status: 403 }
      );
    }

    // Hasta bilgisini çek (log için)
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("name, phone, gender")
      .eq("id", patientId)
      .single();

    if (patientError) {
      console.error("Hasta bulunamadı:", patientError);
      return NextResponse.json(
        { success: false, message: "Hasta bulunamadı." },
        { status: 404 }
      );
    }

    // Kayıt oluştur
    const { data: newRecord, error: insertError } = await supabaseAdmin
      .from("patient_records")
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        record_type: recordType,
        record_date: recordDate || new Date().toISOString().split("T")[0],
        title: title.trim(),
        description: description?.trim() || null,
        price: price || null,
        cost: cost || null,
        created_by: appUser.id,
      })
      .select("id, record_type, title, record_date")
      .single();

    if (insertError) {
      console.error("Insert hatası:", insertError);
      return NextResponse.json(
        {
          success: false,
          message: "Kayıt oluşturulamadı: " + insertError.message,
        },
        { status: 500 }
      );
    }

    // Activity log oluştur
    const { error: activityError } = await supabaseAdmin
      .from("activity_logs")
      .insert({
        clinic_id: clinicId,
        user_id: appUser.id,
        patient_id: patientId,  
        entity: `patient.${recordType}`,
        entity_id: newRecord.id,
        action_type:recordType,
        metadata: {
          patient_name: patientData.name,
          record_type: recordType,
          record_title: title,
          record_date: recordDate || new Date().toISOString().split("T")[0],
          created_by: user.email,
          created_by_name: appUser.name,
          method: "api",
        },
      });

    if (activityError) {
      console.error("Activity log oluşturulamadı:", activityError);
      // Log hatası ana işlemi durdurmaz, sadece log tutuyoruz
    }

    return NextResponse.json(
      {
        success: true,
        data: newRecord,
        message: "Kayıt başarıyla oluşturuldu",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("API Hatası:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}