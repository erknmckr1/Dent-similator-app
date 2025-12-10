import PatientsPageClientContext from "@/app/components/patients/PatientPageClientContext";
import { getAuthenticatedUserWithData, getDoctorPatients } from "@/lib/server-utils";

export default async function PatientsPage() {
  // Tek satırda auth + user data
  const userData = await getAuthenticatedUserWithData();

  // Hastaları getir (daha fazla field ile)
  const patientsData = await getDoctorPatients(
    userData.clinicId,
    userData.authUserId
  );

  // Mapping işlemi
  const formattedPatients = patientsData.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    clinic_id: userData.clinicId,
    gender: p.gender,
    birthdate: p.birthdate,
    national_id_no:p.national_id_no
  }));

  return (
    <PatientsPageClientContext
      patients={formattedPatients}
      clinicId={userData.clinicId}
      doctorPkId={userData.authUserId}
    />
  );
}