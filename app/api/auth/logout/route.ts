import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

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
        action_type: "logout",
        entity: "user",
        entity_id: userData.id,
        metadata: {
          email: data.user?.email,
          name: userData.name,
          logout_time: new Date().toISOString(),
          ip_address:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
        },
      });
    }
    await supabase.auth.signOut();
    return NextResponse.json(
      { message: "Kullanıcı oturumu kapatma işlemi başarılı!" },
      { status: 200 }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Server" }, { status: 500 });
  }
}
