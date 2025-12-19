import {
  getAuthenticatedUserWithData,
  getPatientById,
} from "@/lib/server-utils";
import Image from "next/image";
import {
  ArrowLeft,
  Clock,
  FileText,
  Phone,
  DollarSign,
  FileCheck,
  User,
} from "lucide-react";

import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function PatientFilesPage({
  params,
}: {
  params: { patientId: string };
}) {
  const { patientId } = await params;

  // User data al
  const userData = await getAuthenticatedUserWithData();

  // Hasta detaylarını al
  const patient = await getPatientById(patientId, userData.authUserId);

  // Hasta bulunamadı
  if (!patient) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <p className="text-xl text-destructive">
          Hasta Bulunamadı veya Erişim Engellendi.
        </p>
        <Link
          href="/dashboard/files"
          className="mt-4 inline-flex items-center text-primary hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dosya Listesine Geri Dön
        </Link>
      </div>
    );
  }

  const folders =
    patient.patient_records?.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ) || [];

  return (
    <div className="p-8 max-w-7xl h-screen overflow-y-auto mx-auto">
      {/* Hasta Bilgileri Başlığı */}
      <div className="mb-8 border-b border-border pb-4">
        <Link
          href="/dashboard/files"
          className="inline-flex items-center text-primary hover:underline mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tüm Dosyalar
        </Link>
        <div className="flex gap-x-4 items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-foreground">
              {patient.name}
            </h1>
            <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />{" "}
              {patient.phone || "Telefon Kaydı Yok"}
            </p>
          </div>
        </div>
      </div>

      {/* Simülasyon Klasörleri */}
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        Geçmiş İşlemler
      </h2>

      {folders.length === 0 ? (
        <p className="text-muted-foreground">
          Bu hastaya ait simülasyon kaydı bulunmamaktadır.
        </p>
      ) : (
        <div className="space-y-10">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="border border-border rounded-xl p-6 bg-card shadow-sm"
            >
              <div className="flex justify-between items-start mb-4 border-b border-border pb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold flex items-center gap-3 mb-2 text-card-foreground">
                    <FileText className="w-5 h-5 text-primary" />
                    {folder.title}
                  </h3>

                  {/* Description */}
                  {folder.description && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                      <FileCheck className="w-4 h-4 mt-0.5" />
                      <p>{folder.description}</p>
                    </div>
                  )}

                  {/* Price */}
                  {folder.price && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <DollarSign className="w-4 h-4" />
                      <span>{folder.price} TL</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground flex items-center gap-1 ml-4">
                  <Clock className="w-4 h-4" />
                  {format(new Date(folder.created_at), "dd MMMM yyyy HH:mm", {
                    locale: tr,
                  })}
                </p>
              </div>

              <div className="space-y-4">
                {folder.simulations && folder.simulations.length > 0 ? (
                  folder.simulations.map((simulation) => (
                    <div
                      key={simulation.id}
                      className="flex flex-col sm:flex-row gap-4 border border-border rounded-lg overflow-hidden shadow-md"
                    >
                      {/* Orijinal Görsel */}
                      <div className="relative w-full sm:w-1/2 h-80 bg-muted">
                        <Image
                          src={
                            (simulation.patient_photos as unknown as { original_url: string })?.original_url ||
                            "/placeholder.jpg"
                          }
                          alt={`${simulation.type} - Orijinal`}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transition-transform duration-300 hover:scale-[1.03]"
                        />
                        <div className="absolute bottom-2 left-2 bg-foreground/80 text-background px-3 py-1 rounded-md text-sm font-medium">
                          Orijinal
                        </div>
                      </div>

                      {/* AI Sonuç Görseli */}
                      <div className="relative w-full sm:w-1/2 h-80 bg-muted">
                        <Image
                          src={simulation.ai_url || "/placeholder.jpg"}
                          alt={`${simulation.type} - Sonuç`}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transition-transform duration-300 hover:scale-[1.03]"
                        />
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
                          {simulation.type.toUpperCase()} Sonuç
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Bu kayıtta simülasyon bulunmuyor.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}