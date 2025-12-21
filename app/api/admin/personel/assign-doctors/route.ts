import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Gelen veriyi al
    const { secretaryId, doctorIds, clinicId } = await request.json();

    // 2. Yetki Kontrolü: İsteği atan kullanıcı admin mi ve bu kliniğe mi ait?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminUser } = await supabase
      .from("users")
      .select("role, clinic_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!adminUser || adminUser.role !== "admin" || adminUser.clinic_id !== clinicId) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    // 3. Mevcut atamaları temizle
    // Not: secretary_id ve clinic_id ile filtreleyerek sadece ilgili kliniğin verisini sildiğimizden emin oluyoruz.
    const { error: deleteError } = await supabase
      .from("secretary_doctor_assignments")
      .delete()
      .eq("secretary_id", secretaryId)
      .eq("clinic_id", clinicId);

    if (deleteError) throw deleteError;

    // 4. Yeni atamaları ekle (Eğer liste boş değilse)
    if (doctorIds && doctorIds.length > 0) {
      const newAssignments = doctorIds.map((docId: string) => ({
        secretary_id: secretaryId,
        doctor_id: docId,
        clinic_id: clinicId,
      }));

      const { error: insertError } = await supabase
        .from("secretary_doctor_assignments")
        .insert(newAssignments);

      if (insertError) throw insertError;
    }

    return NextResponse.json(
      { success: true, message: "Atamalar başarıyla güncellendi." },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Assign Doctors Error:", err);
    return NextResponse.json(
      { error: err.message || "İşlem sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}