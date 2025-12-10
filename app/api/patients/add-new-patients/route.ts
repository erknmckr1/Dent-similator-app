import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
      clinic_id,
      assigned_doctor,
      name,
      phone,
      gender,
      birthdate,
      notes,
      national_id_no
    } = body;

    // Validasyon
    if (!clinic_id || !assigned_doctor || !name || !gender || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Zorunlu alanlar eksik: clinic_id, assigned_doctor, name, gender, phone",
        },
        { status: 400 }
      );
    }

    // Kullanıcı kontrolü
    const { data: appUser, error: userError } = await supabase
      .from("users")
      .select("id, clinic_id, role, auth_user_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!appUser || userError) {
      console.error("Kullanıcı bulunamadı:", userError);
      return NextResponse.json(
        { success: false, message: "Kullanıcı kaydı bulunamadı." },
        { status: 404 }
      );
    }

    // Klinik yetkisi kontrolü
    if (appUser.clinic_id !== clinic_id) {
      return NextResponse.json(
        { success: false, message: "Bu kliniğe erişim yetkiniz yoktur." },
        { status: 403 }
      );
    }

    // assigned_doctor kontrolü - bu kullanıcının auth_user_id'si olmalı
    if (assigned_doctor !== appUser.auth_user_id) {
      return NextResponse.json(
        { success: false, message: "Yalnızca kendinize hasta atayabilirsiniz." },
        { status: 403 }
      );
    }

    // Aynı klinik içinde aynı telefon numarasıyla kayıt var mı kontrol et
    const { data: existingPatient } = await supabaseAdmin
      .from("patients")
      .select("id, name")
      .eq("clinic_id", clinic_id)
      .eq("phone", phone)
      .maybeSingle();

    if (existingPatient) {
      return NextResponse.json(
        {
          success: false,
          message: `Bu telefon numarası ile zaten bir hasta kaydı mevcut: ${existingPatient.name}`,
        },
        { status: 409 }
      );
    }

    // Kayıt oluştur
    const { data: newRecord, error: insertError } = await supabaseAdmin
      .from("patients")
      .insert({
        clinic_id,
        assigned_doctor,
        national_id_no,
        name,
        phone,
        gender,
        birthdate: birthdate || null,
        notes: notes || null,
      })
      .select("id, name, phone, gender, created_at")
      .single();

    if (insertError) {
      console.error("Insert hatası:", insertError);
      return NextResponse.json(
        {
          success: false,
          message: "Hasta kaydı oluşturulamadı: " + insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newRecord,
        message: "Hasta başarıyla eklendi",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Hatası:", error);
    return NextResponse.json(
      { message: "Internal Server Error", success: false },
      { status: 500 }
    );
  }
}