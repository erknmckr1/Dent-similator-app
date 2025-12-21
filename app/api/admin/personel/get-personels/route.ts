import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET() {
  const supabase = await createClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. ADIM: İsteği atan kullanıcının ADMIN olup olmadığını ve KLİNİK ID'sini kontrol et
    const { data: currentUser, error: roleError } = await supabase
      .from("users")
      .select("role, clinic_id")
      .eq("auth_user_id", user.id)
      .single();

    if (roleError || !currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    // 2. ADIM: Personelleri ve Sekreterlerin atandığı doktorları JOIN ile çek
    // 'secretary_doctor_assignments' tablosu da sorguya dahil
    const { data: personels, error } = await supabase
      .from("users")
      .select(`
        *,
        secretary_doctor_assignments:secretary_doctor_assignments!secretary_doctor_assignments_secretary_id_fkey (
          doctor:users!secretary_doctor_assignments_doctor_id_fkey (
            name,
            id
          )
        )
      `)
      .eq("clinic_id", currentUser.clinic_id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: personels, message: "Personel listesi başarıyla getirildi" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching personels:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}