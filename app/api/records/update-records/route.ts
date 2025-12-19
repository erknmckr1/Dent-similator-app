import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// export default yerine direkt metod ismini export et
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Gelen ID'yi kontrol et
    const { recordId, ...updateData } = body;
    if (!recordId) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    // 2. Veritabanı Güncelleme İşlemi
    const { data, error } = await supabase
      .from("patient_records")
      .update({
        record_type: updateData.recordType,
        record_date: updateData.recordDate,
        title: updateData.title,
        description: updateData.description,
        price: updateData.price,
        cost: updateData.cost,
      })
      .eq("id", recordId)
      .eq("clinic_id", userData.user.user_metadata.clinic_id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Güncellenecek kayıt bulunamadı. ID'yi kontrol edin.",
        },
        { status: 404 }
      );
    }

    // Activity Log Oluşturma
    const { error: logError } = await supabase.from("activity_logs").insert({
      clinic_id: userData.user.user_metadata.clinic_id, // Metadata'dan al
      user_id: userData.user?.user_metadata?.user_id,
      patient_id: updateData.patientId, // Gelen veriden al
      action_type: "UPDATE",
      entity: "patient_records",
      entity_id: recordId,
      metadata: {
        title: updateData.title,
        record_type: updateData.recordType,
        new_date: updateData.recordDate,
        updated_by: userData.user.email,
        source: "calendar_form",
      },
    });

    if (logError) {
      console.error("Log oluşturma hatası:", logError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Kayıt başarıyla güncellendi",
      data,
    });
  } catch (err: any) {
    console.error("Update Error:", err);
    return NextResponse.json(
      { error: "Failed to update records", details: err.message },
      { status: 500 }
    );
  }
}
