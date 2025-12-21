import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/server";

import nodemailer from "nodemailer";
// SMTP Transport Objesini Oluştur

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Port 587 (TLS/STARTTLS) icin false kullanilir
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Uygulamaya Özel Şifre olmalı!
  },
});
export async function POST(request: NextRequest) {
  const finalOrigin =
    process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const supabase = await createClient();
  const { email, role } = await request.json();
  const invitationToken = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); // 24 sonra biten davet

  if (!email || !role) {
    return NextResponse.json(
      { error: "Eksik bilgi: role, e-posta  gereklidir." },
      { status: 400 }
    );
  }

  const validRoles = ["staff", "doctor", "marketing","secretary"];
  if (!validRoles.includes(role.toLowerCase())) {
    return NextResponse.json(
      { error: "Geçersiz rol türü belirtildi." },
      { status: 400 }
    );
  }
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapılmamış. Yetkilendirme hatası." },
        { status: 403 }
      );
    }

    // 3. Admin'in Klinik ID'sini ve User ID'sini bul
    // Bu sorgu, kullanicinin kliniğini ve kendi user_id'sini (invited_by) verir.
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("clinic_id,id")
      .eq("auth_user_id", user.user?.id)
      .single();
    if (userError || !userData?.clinic_id) {
      return NextResponse.json(
        { error: "Klinik bilgisi bulunamadı veya Admin yetkisi yok." },
        { status: 403 }
      );
    }

    // 4. Daveti invitations tablosuna kaydet
    const { error: inviteError } = await supabase.from("invitations").insert({
      clinic_id: userData.clinic_id,
      invited_by_user_id: userData.id,
      email: email.toLowerCase(),
      role: role.toLowerCase(),
      token: invitationToken,
      expires_at: expiresAt,
    });

    if (inviteError) {
      if (inviteError.code === "23505") {
        // Benzersizlik hatası
        return NextResponse.json(
          { error: "Bu kullanıcı zaten kliniğinize davet edilmiş." },
          { status: 409 }
        );
      }
      console.error("DB Davet Kaydı Hatası:", inviteError);
      return NextResponse.json(
        { error: "Davet oluşturulurken bir veritabanı hatası oluştu." },
        { status: 500 }
      );
    }

    // 5. E-posta Gönderimi (Link Bilgisi)
    // GERCEK UYGULAMADA: Buraya Email Servisiniz ile Davet Kabul Etme Linki gonderilmelidir.
    const invitationLink = `${finalOrigin}/invite?token=${invitationToken}&email=${encodeURIComponent(
      email
    )}`;

    const mailOptions = {
      from: process.env.SMTP_USER, // E-posta adresi (erkanm499@gmail.com)
      to: email, // Davet edilen
      subject: "DentVision Klinik Daveti",
      html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #007bff;">DentVision Klinik Daveti</h2>
                    <p>Merhaba,</p>
                    <p><strong>${role}</strong> rolüyle kliniğimize davet edildiniz. Hesabınızı oluşturmak için aşağıdaki linke tıklayın:</p>
                    <table cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                        <tr>
                            <td align="center" style="border-radius: 4px; background-color: #10B981;">
                                <a 
                                   href="${invitationLink}" 
                                   target="_blank" 
                                   style="padding: 12px 24px; border: 1px solid #10B981; border-radius: 4px; font-weight: bold; font-size: 16px; text-decoration: none; color: #ffffff; display: inline-block;"
                                >
                                    Daveti Kabul Et ve Şifre Belirle
                                </a>
                            </td>
                        </tr>
                    </table>
                    <p style="font-size: 12px; color: #777;">Bu davet linki 24 saat geçerlidir.</p>
                </div>
            `,
    };

    const mail = await transporter.sendMail(mailOptions);
    if (mail.rejected.length > 0) {
      console.error("Nodemailer Mail Gönderilemedi:", mail.rejected);
      return NextResponse.json(
        {
          error:
            "Davet oluşturuldu ancak e-posta gönderilemedi. SMTP hatası mevcut.",
        },
        { status: 500 }
      );
    }
    // 6. Başarılı Yanıt
    return NextResponse.json(
      {
        message: "Davet başarıyla oluşturuldu ve link gönderimi simüle edildi.",
        invitationLink: invitationLink,
      },
      { status: 200 }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "" }, { status: 500 });
  }
}
