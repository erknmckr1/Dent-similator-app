import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { email, password } = await request.json();

  // 1.1 Temel Dogrulama
  if (!email || !password) {
    return NextResponse.json(
      { error: "E-posta ve şifre gereklidir." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    // Kullanıcının users tablosundaki bilgilerini al (user_id ve clinic_id için)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clinic_id, name")
      .eq("auth_user_id", data.user?.id)
      .single();

    if (!userError && userData) {
      // Activity log oluştur
      await supabase.from("activity_logs").insert({
        clinic_id: userData.clinic_id,
        user_id: userData.id, // users.id (PK) - NOT auth_user_id
        action_type: "login",
        entity: "user",
        entity_id: userData.id,
        metadata: {
          email: data.user?.email,
          name: userData.name,
          login_time: new Date().toISOString(),
          ip_address:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
        },
      });
    }

    // 3. Giriş başarılı
    const response = NextResponse.json(
      {
        message: "Giriş başarılı.",
        user: { id: data.user?.id, email: data.user?.email },
      },
      { status: 200 }
    );

    await supabase.from("activity_logs").insert({
      user_id: data.user?.id,
      action_type: "login",
      description: "Kullanıcı giriş yaptı.",
    });

    return response;
  } catch (err) {
    console.error("Sunucu Hatası:", err);
    return NextResponse.json(
      { error: "Beklenmedik bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
