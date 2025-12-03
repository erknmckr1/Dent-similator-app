import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST() {
  try {
    const supabase = await createClient();
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
