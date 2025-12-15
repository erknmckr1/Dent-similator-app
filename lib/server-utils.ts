import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Tip tanımları
 */
export interface UserData {
  name: string;
  role: string;
  authUserId: string;
  clinicId: string;
  userId: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  birthdate?: string | null;
  gender?: string | null;
  created_at?: string;
  notes?: string | null;
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/auth/login");
  }

  return user.id;
}

/* Kullanıcı detaylarını getirir (clinic_id, role, vs.)
 */
export async function getCurrentUserData(authUserId: string) {
  const supabase = await createClient();

  const { data: userData, error } = await supabase
    .from("users")
    .select("name, role, auth_user_id, clinic_id, id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !userData) {
    console.error("User data fetch error:", error);
    throw new Error("Kullanıcı bilgileri alınamadı");
  }

  return {
    name: userData.name,
    role: userData.role,
    authUserId: userData.auth_user_id,
    clinicId: userData.clinic_id,
    userId: userData.id,
  };
}

/**
 * Tek bir fonksiyonda hem auth hem user data kontrolü
 */
export async function getAuthenticatedUserWithData() {
  const authUserId = await getAuthenticatedUser();
  const userData = await getCurrentUserData(authUserId);

  return userData;
}

/**
 * Bir doktora ait hastaları getirir
 */
export async function getClinicPatients(clinicId: string) {
  const supabase = await createClient();

  const { data: patientsData, error } = await supabase
    .from("patients")
    .select(
      "id, name, phone, birthdate, gender, created_at, notes, national_id_no"
    )
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Patients fetch error:", error);
    return [];
  }

  return patientsData || [];
}

/**
 * Belirli bir hastanın detaylarını getirir
 */
export async function getPatientById(patientId: string, doctorAuthId: string) {
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select(
      `
      id, 
      name, 
      phone, 
      gender, 
      birthdate, 
      notes,
      national_id_no,
      created_at,
      patient_records (
        id, 
        record_type, 
        title, 
        description, 
        price, 
        created_at,
        simulations!simulations_record_id_fkey (
          id, 
          type, 
          ai_url,
          patient_photos!simulations_photo_id_fkey (
            original_url
          )
        )
      )
    `
    )
    .eq("id", patientId)
    .eq("assigned_doctor", doctorAuthId)
    .maybeSingle();

  if (error) {
    console.error("Patient fetch error:", error);
    return null;
  }

  return patient;
}

// Aktiviteleri çekecek foksiyon

export async function getHistoryData() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return console.error("History fetch error:", error);
  }

  return data ?? [];
}
