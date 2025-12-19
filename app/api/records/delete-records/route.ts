import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const { error } = await supabase
      .from("patient_records")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", userData.user.user_metadata.clinic_id)
      .eq("doctor_id", userData.user.user_metadata.user_id);

    if (error) throw error;

    // Activity Log: Silme işlemini kaydet
    await supabase.from("activity_logs").insert({
      clinic_id: userData.user.user_metadata.clinic_id,
      user_id: userData.user.user_metadata.user_id,
      action_type: "DELETE",
      entity: "patient_records",
      entity_id: id,
      metadata: { source: "calendar_delete_btn" },
    });

    return NextResponse.json({
      success: true,
      message: "Kayıt başarıyla pasife çekildi.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
