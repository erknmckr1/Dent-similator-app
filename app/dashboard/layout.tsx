import DashboardLayoutWrapper from "../components/dashboard/DashboardLayoutWrapper";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface ClinicsData {
  credits_remaining: number;
}
interface LayoutUserData {
  name: string;
  role: string;
  clinics: ClinicsData | null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }
  const authUserId = user.id;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("name, role, clinics(credits_remaining)") // creditCount için clinics tablosunu join'liyoruz
    .eq("auth_user_id", authUserId)
    .returns<LayoutUserData[]>() // Dönen yapıyı dizi olarak tanımlıyoruz
    .single(); // Tek bir kullanıcı beklediğimizi belirtiyoruz

  if (userError || !userData) {
    console.error("Layout: Kullanıcı verisi çekilemedi:", userError?.message);
    return null;
  }

  const creditCount = userData.clinics?.credits_remaining ?? 0;

  const userInfo = {
    name: userData.name,
    role: userData.role,
    creditCount: creditCount, // Artık dinamik
  };

  return (
    <DashboardLayoutWrapper userInfo={userInfo}>
      {children}
    </DashboardLayoutWrapper>
  );
}
