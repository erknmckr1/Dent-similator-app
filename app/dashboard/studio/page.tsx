import React from "react";
import DentalSimulator from "./ClientDentalSimulator";
import { createClient } from "@/lib/supabase/server";
async function page() {
  const supabase = await createClient();

  // Auth kontrolü ve user çekme (Layout'ta zaten yapılsa da, burada veriyi çekeceğiz)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // User artık layout'tan garanti edildiği için doğrudan kullanılabilir.
  const authUserId = user!.id;

  // --- 1. Kullanıcının Klinik ID'sini Çekme ---
  const { data: userData } = await supabase
    .from("users")
    .select("clinic_id")
    .eq("auth_user_id", authUserId)
    .single();

  const clinicId = userData?.clinic_id || null;

  // --- 2. Hasta Verilerini Çekme ---
  // Clinic ID yoksa boş liste döndürerek hata oluşmasını engelle
  const { data: patientsData, error } = clinicId
    ? await supabase
        .from("patients")
        .select("id, name, phone") // Client Component için gerekli veriler
        .eq("clinic_id", clinicId)
        .eq("assigned_doctor", authUserId)
        .order("name", { ascending: true })
    : { data: [], error: null };

  // Veriyi Client Component'in beklediği formata dönüştür
  const formattedPatients = patientsData
    ? patientsData.map((p) => ({
        value: p.id,
        label: p.name,
        phone: p.phone,
      }))
    : [];
  return (
    <>
      <DentalSimulator patients={formattedPatients} />;
    </>
  );
}

export default page;
