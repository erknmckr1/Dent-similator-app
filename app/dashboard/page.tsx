
import DashboardClientContent from "../components/dashboard/DashboardClientContext";
import { getAuthenticatedUserWithData,getClinicPatients } from "@/lib/server-utils";
export default async function GeneralOverviewPage() {
  const userData = await getAuthenticatedUserWithData();

  // Hastaları getir
  const patientsData = await getClinicPatients(
    userData.clinicId,
  );

  // Mapping işlemi
  const formattedPatients = patientsData.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    clinic_id: userData.clinicId,
  }));


  return (
    <DashboardClientContent
      doctorName={userData.name}
      patients={formattedPatients}
      clinicId={userData.clinicId}
      doctorPkId={userData.authUserId}
    />
  );
}
