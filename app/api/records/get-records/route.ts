import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // 1. Yetki Kontrolü
    if (!user || authError) {
      return NextResponse.json(
        { success: false, message: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    const doctorId = user.user_metadata?.user_id;
    const clinicId = user.user_metadata?.clinic_id;
    if (!doctorId || !clinicId) {
      return NextResponse.json(
        { success: false, message: "Eksik profil bilgisi" },
        { status: 403 }
      );
    }

    // 3. Sorgu: Sadece bu doktor ve bu klinik!
    const query = supabase
      .from("patient_records")
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
    patients (
      name
    )
  `
      )
      .eq("clinic_id", clinicId)
      .eq("created_by", doctorId)
      .is("deleted_at", null);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("API error:", err?.message);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
