import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  const supabase = await createClient()
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

    // 3. Giriş başarılı
    const response = NextResponse.json(
      {
        message: "Giriş başarılı.",
        user: { id: data.user?.id, email: data.user?.email },
      },
      { status: 200 }
    );

    return response;
  } catch (err) {
    console.error("Sunucu Hatası:", err);
    return NextResponse.json(
      { error: "Beklenmedik bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
