import { NextResponse } from "next/server";

// /app/api/auth/register-admin/route.ts (Örneğimiz)

import { createClient } from "@supabase/supabase-js";

// Service Role Key'in sadece bu dosya içinde kullanimi:
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

export async function POST(request: Request) {
  const { clinicName, fullName, email, password, phone, confirmPassword } =
    await request.json();

  // 1.1 Temel Dogrulama
  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Şifreler eşleşmiyor." },
      { status: 400 }
    );
  }
  try {
    // 2. SUPABASE AUTH KAYDI (auth.users)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signUp({
        email,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Kullanıcı kaydı başarısız." },
        { status: 400 }
      );
    }

    // Auth kaydı başarılı: Kullanıcı ID'sini alıyoruz
    const auth_user_id = authData.user.id;

    // 3a. Yeni Kliniği Olustur (public.clinics)
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .insert({
        name: clinicName,
        phone: phone,
        credits_remaining: 100,
      })
      .select()
      .single();

    if (clinicError) {
      // Hata: Klinik oluşturulamazsa, Auth kaydını silerek geri al (Rollback)
      await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
      return NextResponse.json(
        { error: "Klinik kaydı oluşturulamadı." },
        { status: 500 }
      );
    }

    const clinicId = clinic.id;

    const { error: userError } = await supabaseAdmin.from("users").insert([
      {
        auth_user_id: auth_user_id,
        clinic_id: clinicId,
        role: "admin",
        name: fullName,
        email: email,
        is_active: true,
      },
    ]);
    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
      await supabaseAdmin.from("clinics").delete().eq("id", clinicId);
      return NextResponse.json(
        { error: "Yönetici profili oluşturulamadı." },
        { status: 500 }
      );
    }

    // BAŞARILIYSA
    return NextResponse.json(
      { message: "Kayıt başarılı! Lütfen e-postanızı onaylayın." },
      { status: 200 }
    );
  } catch (err) {
    console.error("Sunucu Hatası:", err);
    return NextResponse.json(
      { message: "Beklenmedik bir hata olustu" },
      { status: 500 }
    );
  }
}
