import { createClient } from "@/lib/supabase/server";
import DashboardClientContent from "../components/dashboard/DashboardClientContext";

export default async function GeneralOverviewPage() {
  const supabase = await createClient();
  const { data: user, error } = await supabase.auth.getUser();
  const authId = user.user?.id;
  // Middleware zaten auth kontrolü yaptı, güvenle veri çekebiliriz
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("name, role, auth_user_id")
    .eq("auth_user_id", authId)
    .single();
    
  // Eğer veri yoksa fallback değer kullan (redirect yerine)
  const doctorName = userData?.name || userData?.role || "Klinik Yöneticisi";

  return <DashboardClientContent doctorName={doctorName} />;
}
