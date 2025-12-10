import React from "react";
import {
  User,
  Phone,
  Calendar,
  Edit,
  FileText,
  X,
  NotebookIcon,
  MessageCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    name: string;
    national_id_no: string;
    phone: string | null;
    birthdate: string;
    gender: string | null;
  } | null;
  onEdit?: () => void;
  onViewHistory?: () => void;
}

function PatientDetailModal({
  isOpen,
  onClose,
  patient,
  onEdit,
  onViewHistory,
}: PatientDetailModalProps) {
  if (!patient) return null;

  const handleWhatsAppClick = (phone: string | null, name: string) => {
    // Telefon numarasını temizle (boşlukları, parantezleri, tireleri kaldır)
    const cleanedPhone = phone?.replace(/[^\d]/g, "");

    // Eğer numara uluslararası formatta gelmiyorsa, bu mantığı kullanın:
    const countryCode = "90"; // Türkiye
    const fullNumber = cleanedPhone?.startsWith(countryCode)
      ? cleanedPhone
      : countryCode + cleanedPhone;

    // Mesaj içeriğini encode et (İsteğe bağlı)
    const encodedMessage = encodeURIComponent(
      `Merhaba ${name}, kliniğimizden size ulaşıyoruz.`
    );

    // WhatsApp Web/API URL'sini oluştur
    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

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

  const age = calculateAge(patient.birthdate);
  const birthDate = new Date(patient.birthdate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Hasta Detayları
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {patient.name} - Hasta bilgileri ve özeti
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Temel Bilgiler */}
          <div className="flex items-center gap-4 pb-6 border-b border-border">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                {patient.name}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {patient.gender === "Male"
                  ? "Erkek"
                  : patient.gender === "Female"
                  ? "Kadın"
                  : "Belirtilmemiş"}{" "}
                · {age} yaş
              </p>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <NotebookIcon className="w-4 h-4 text-primary" />
                Tc Kimlik No
                <div className="text-muted-foreground text-sm mt-1">
                  {patient.national_id_no}
                </div>
              </h4>
            </div>
          </div>

          {/* İletişim Bilgileri */}
          <div className="bg-accent/50 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              İletişim Bilgileri
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Telefon Numarası
                  </p>
                  <p className="font-medium">
                    {patient.phone || "Telefon bilgisi yok"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kişisel Bilgiler */}
          <div className="bg-accent/50 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Kişisel Bilgiler
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Doğum Tarihi
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {birthDate.toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Yaş</div>
                <div className="text-2xl font-bold text-primary">{age}</div>
              </div>
            </div>
          </div>

          {/* Cinsiyet Bilgisi */}
          <div className="bg-accent/50 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">Cinsiyet</h4>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
              {patient.gender === "Male"
                ? "👨 Erkek"
                : patient.gender === "Female"
                ? "👩 Kadın"
                : "❓ Belirtilmemiş"}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border p-6 pt-4 flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            <X className="w-4 h-4 mr-2" />
            Kapat
          </Button>
          <Button
            onClick={() => handleWhatsAppClick(patient?.phone, patient.name)}
            className="flex justify-center items-center rounded-full  bg-green-500 text-white hover:bg-green-600"
          >
            <MessageCircle className="w-4 h-4 " />
            
          </Button>
          <Button
            variant="outline"
            onClick={onViewHistory}
            className="flex-1 sm:flex-none"
          >
            <FileText className="w-4 h-4 mr-2" />
            Geçmişi Görüntüle
          </Button>
          <Button
            onClick={onEdit}
            className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PatientDetailModal;
