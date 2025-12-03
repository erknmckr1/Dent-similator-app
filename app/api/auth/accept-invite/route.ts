// /app/api/auth/accept-invite/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {

    // 1. Gelen Verileri Al (Formdan password, URL'den token ve email)
    const { token, email, password } = await request.json(); 
    
    // Auth kaydı sırasında kullanılmak üzere ID'yi dışarıda tutuyoruz (Rollback için)
    let auth_user_id: string | null = null; 

    // Adım 0: Temel dogrulama
    if (!token || !email || !password) {
        return NextResponse.json(
            { error: "Davet tokenı, e-posta ve şifre gereklidir." },
            { status: 400 }
        );
    }

    try {
        // 2. Adım: Tokeni bul ve süresini kontrol et
        const { data: inviteData, error: tokenError } = await supabaseAdmin
            .from('invitations')
            .select('clinic_id, role, expires_at')
            .eq('token', token)
            .eq('email', email)
            .single();

        if (tokenError || !inviteData) {
            return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş davet linki.' }, { status: 401 });
        }

        // Süre Kontrolü
        if (new Date(inviteData.expires_at) < new Date()) {
            // Süresi dolmuş daveti sil (temizlik)
            await supabaseAdmin.from('invitations').delete().eq('token', token);
            return NextResponse.json({ error: 'Davet süresi dolmuştur. Lütfen yeni bir davet isteyin.' }, { status: 401 });
        }

        // 3. Adım: Supabase Auth Kaydı
        const { data: authData, error: authSignUpError } = await supabaseAdmin.auth.signUp({
            email,
            password,
        });
        
        // Benzersiz e-posta hatasını özel olarak yakala
        if (authSignUpError && authSignUpError.message.includes('already registered')) {
            return NextResponse.json({ error: 'Bu e-posta adresi zaten sistemde kayıtlı.' }, { status: 409 });
        }
        
        if (authSignUpError || !authData.user) {
            return NextResponse.json({ error: authSignUpError?.message || 'Kayıt başarısız oldu.' }, { status: 400 });
        }
        
        auth_user_id = authData.user.id;
        
        // --- 4. & 5. Adım: Profil Oluşturma ve Temizlik ---
        
// 4. Adım: Profil Olusturma (public.users)
        const { error: userProfileError } = await supabaseAdmin
            .from('users')
            .insert({
                auth_user_id: auth_user_id,
                clinic_id: inviteData.clinic_id,
                role: inviteData.role, 
                email: email,
                name: email, // <-- Eğer bu hata verirse, burayı değiştireceğiz
            });

        if (userProfileError) {
            // Buraya HATA KODUNU TERMINALE YAZDIRAN KISIM EKLENMELİ:
            console.error("USERS TABLOSU INSERT HATASI:", userProfileError); 
            
            // Hata: Auth kaydını geri al ve daveti sil (Rollback)
            await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
            await supabaseAdmin.from('invitations').delete().eq('token', token);
            
            // Eğer hata, NOT NULL (23502) veya CHECK (23514) ise, bunu Admin'e söyle
            if (userProfileError.code === '23502') {
                return NextResponse.json({ error: 'Kullanıcı adı/isim alanı eksik.' }, { status: 500 });
            }
            
            return NextResponse.json({ error: 'Kullanıcı profili oluşturulamadı.' }, { status: 500 });
        }
        
        // 5. Adım: Temizlik (Kullanılan Token'ı sil)
        await supabaseAdmin.from('invitations').delete().eq('token', token);

        // 6. Adım: Başarılı Yanıt (Client'a 200 döner)
        return NextResponse.json({ message: 'Davet başarıyla kabul edildi ve hesabınız oluşturuldu.' }, { status: 200 });

    } catch (err) {
        // Genel yakalama: Auth kaydı yarım kaldıysa temizle
        if (auth_user_id) {
            await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
        }
        console.error("Token kabul etme sunucu hatası:", err);
        return NextResponse.json({ error: "Beklenmedik bir sunucu hatası oluştu." }, { status: 500 });
    }
}