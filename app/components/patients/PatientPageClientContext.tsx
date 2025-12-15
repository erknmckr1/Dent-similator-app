"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  Filter,
  User,
  Phone,
  Calendar,
  Edit,
  Eye,
  File,
} from "lucide-react";
import NewPatientModal from "@/app/components/patients/NewPatientModal";
import { Button } from "@/components/ui/button";
import PatientDetailModal from "./PatientDetailModal";
interface PatientsProp {
  id: string;
  name: string;
  phone: string | null;
  clinic_id: string;
  birthdate: string;
  gender: string | null;
  national_id_no: string;
}

const PatientsPageClientContext = ({
  patients: initialPatients,
  clinicId,
  doctorPkId,
}: {
  patients: PatientsProp[];
  clinicId: string;
  doctorPkId: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientsProp | null>(
    null
  );
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const router = useRouter();
  const [filters, setFilters] = useState({
    gender: "all",
    ageRange: "all",
  });

  // Yaş hesaplama fonksiyonu
  const calculateAge = (birthdate: string): number => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Filtrelenmiş hastalar
  const filteredPatients = initialPatients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchQuery));

    const matchesGender =
      filters.gender === "all" || patient.gender === filters.gender;

    const age = calculateAge(patient.birthdate);
    const matchesAge =
      filters.ageRange === "all" ||
      (filters.ageRange === "0-30" && age <= 30) ||
      (filters.ageRange === "31-40" && age > 30 && age <= 40) ||
      (filters.ageRange === "41+" && age > 40);

    return matchesSearch && matchesGender && matchesAge;
  });

  // Modal açma fonksiyonu
  const handleViewPatient = (patient: PatientsProp) => {
    setSelectedPatient(patient);
    setIsDetailModalOpen(true);
  };


  //  Geçmiş görüntüleme fonksiyonu
  const handleViewHistory = () => {
    if (selectedPatient) {
      // /dashboard/files/[patientId] sayfasına yönlendir
      window.location.href = `/dashboard/files/${selectedPatient.id}`;
    }
  };
  // Hasta ekleme basalısı ıse sayfayı yenıle
  const handleAddedPatient = () => {
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl flex items-center gap-x-2 font-semibold text-foreground">
              <File /> Hastalar
            </h1>
            <p className="text-muted-foreground mt-1">
              Hasta kayıtlarını görüntüleyin ve yönetin
            </p>
          </div>
          <Button
            onClick={() => setIsNewPatientModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 "
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Yeni Hasta Ekle
          </Button>
        </div>

        {/* Arama ve Filtreler */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
          <div className="flex gap-3">
            {/* Arama */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="İsim veya telefon ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              />
            </div>

            {/* Filtre Butonu */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-accent transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filtrele
            </button>
          </div>

          {/* Filtre Seçenekleri */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Cinsiyet
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) =>
                    setFilters({ ...filters, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                >
                  <option value="all">Tümü</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Yaş Aralığı
                </label>
                <select
                  value={filters.ageRange}
                  onChange={(e) =>
                    setFilters({ ...filters, ageRange: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                >
                  <option value="all">Tümü</option>
                  <option value="0-30">0-30 yaş</option>
                  <option value="31-40">31-40 yaş</option>
                  <option value="41+">41+ yaş</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="text-muted-foreground text-sm mb-1">
              Toplam Hasta
            </div>
            <div className="text-3xl font-bold text-foreground">
              {initialPatients.length}
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="text-muted-foreground text-sm mb-1">
              Filtrelenen
            </div>
            <div className="text-3xl font-bold text-foreground">
              {filteredPatients.length}
            </div>
          </div>
        </div>

        {/* Hasta Listesi */}
        <div className="space-y-3">
          {filteredPatients.map((patient) => {
            const age = calculateAge(patient.birthdate);
            const birthDate = new Date(patient.birthdate);

            return (
              <div
                key={patient.id}
                className="bg-card rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-7 h-7 text-primary" />
                    </div>

                    {/* Bilgiler */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {patient.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>
                          {patient.gender || "Belirtilmemiş"} · {age} yaş
                        </span>
                        {patient.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {patient.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {birthDate.toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aksiyonlar */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleViewPatient(patient)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title="Görüntüle"
                    >
                      <Eye className="w-5 h-5 text-foreground" />
                    </button>
                    <button
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-5 h-5 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPatients.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Sonuç bulunamadı</p>
            </div>
          )}
        </div>

        {/* Hasta Detay Modal */}
        <PatientDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          onEdit={handleEditPatient}
          onViewHistory={handleViewHistory}
        />

        <NewPatientModal
          isOpen={isNewPatientModalOpen}
          onClose={() => setIsNewPatientModalOpen(false)}
          clinicId={clinicId}
          doctorPkId={doctorPkId}
          onSuccess={handleAddedPatient}
        />
      </div>
    </div>
  );
};

export default PatientsPageClientContext;
