// /middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "./lib/supabase/server";

// Korumasiz (public) yolları tanımla:
const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password"];
const DEFAULT_REDIRECT = "/dashboard";

export async function middleware(request: NextRequest) {
  try {
    // 1. Sunucu tarafi Supabase Client'ini olustur
    const supabase = await createClient();

    // 2. Oturum Kontrolü
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 3. Yonlendirme Mantigi (Korumasiz Sayfalar Icin)

    const isPublicPath = PUBLIC_PATHS.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    // Kriter: Kullanıcı GİRİŞ YAPMIŞ ve korumasız bir sayfaya gitmeye çalışıyor
    if (session && isPublicPath) {
      return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
    }

    // Middleware'i sadece PUBLIC sayfalar icin kullaniyoruz.

    // Session varsa veya public bir yoldaysa, devam et
    if (!session) {
      if (!isPublicPath) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
    }
  } catch (error) {
    console.log(error);
    // Genellikle hata, Supabase ile iletisim sorunlarinda olur. Devam et
    return NextResponse.next();
  }
}

// /middleware.ts dosyasinin altina eklenmeli
export const config = {
  matcher: [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/dashboard/:path*",
  ],
};
