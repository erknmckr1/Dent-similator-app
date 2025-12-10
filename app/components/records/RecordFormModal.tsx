"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Stethoscope,
  Save,
  X,
  DollarSign,
  Check,
  ChevronsUpDown,
  User,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import axios from "axios";

// --- TIP TANIMLARI ---
interface PatientOption {
  id: string;
  name: string;
  phone: string | null;
  clinic_id: string;
}

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientOption[];
}

interface RecordFormData {
  recordType: "TREATMENT" | "PAYMENT" | "NOTE";
  recordDate: string;
  title: string;
  description: string;
  price: string;
  cost: string;
}

const RECORD_TYPES = [
  { value: "TREATMENT", label: "Tedavi (Diş Çekimi, Dolgu, Kanal vb.)" },
  { value: "PAYMENT", label: "Ödeme Kaydı" },
  { value: "NOTE", label: "Basit Klinik Not" },
];

export const RecordFormModal = ({
  isOpen,
  onClose,
  patients,
}: RecordFormModalProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordFormData>({
    defaultValues: {
      recordDate: format(new Date(), "yyyy-MM-dd"),
      recordType: "TREATMENT",
      title: "",
      description: "",
      price: "",
      cost: "",
    },
  });

  // --- STATE'LER ---
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(
    null
  );

  // Modal kapandığında formu sıfırla
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedPatient(null);
    }
  }, [isOpen, reset]);

  // --- KOMBOBOX İŞLEYİCİSİ ---
  const handlePatientSelect = (patient: PatientOption) => {
    setSelectedPatient(patient);
    setOpen(false);
  };

  // Form Gönderme
  const onSubmit = async (data: RecordFormData) => {
    if (!selectedPatient) {
      toast.error("Lütfen bir hasta seçin.");
      return;
    }

    const payload = {
      patientId: selectedPatient.id,
      clinicId: selectedPatient.clinic_id,
      recordType: data.recordType,
      recordDate: data.recordDate,
      title: data.title,
      description: data.description,
      price: data.price ? parseFloat(data.price) : null,
      cost: data.cost ? parseFloat(data.cost) : null,
    };

    try {
      const response = await axios.post("/api/records", payload);

      // response.status yerine response.data.success kontrolü daha güvenli
      if (response.data.success) {
        toast.success(
          response.data.message || "Hasta işlem kaydı başarıyla oluşturuldu."
        );
        onClose(); // Sadece başarılıysa kapat
      }
    } catch (err: any) {
      console.error("Kayıt oluşturma hatası:", err);

      // Daha detaylı hata mesajı
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Hasta işlem kaydı oluşturulamadı";
      toast.error(errorMessage);
    }
  };

  const currentRecordType = watch("recordType");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-card p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            Yeni Klinik İşlem Kaydı
          </DialogTitle>
          <DialogDescription>
            Hastaya ait yeni tedavi, ödeme veya not kaydını buradan
            ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* --- 1. HASTA SEÇİMİ (Combobox) --- */}
          <div className="border border-border rounded-lg p-3 bg-background/50">
            <Label className="text-sm font-medium text-foreground block mb-2">
              Hasta Seçimi *
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-12 text-md shadow-sm border-gray-300 bg-white"
                >
                  {selectedPatient ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/30">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {selectedPatient.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Hasta Seçiniz...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0">
                <Command>
                  <CommandInput placeholder="Hasta ara (isim veya tel)..." />
                  <CommandList>
                    <CommandEmpty>Hasta bulunamadı.</CommandEmpty>
                    <CommandGroup heading="Hastalarım">
                      {patients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.name} ${patient.phone || ""}`}
                          onSelect={() => handlePatientSelect(patient)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPatient?.id === patient.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{patient.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {patient.phone || "Tel Kaydı Yok"}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <div className="p-1 border-t">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start text-primary h-8 text-sm hover:text-primary-foreground hover:bg-primary/10"
                        onClick={() => {
                          // Yeni hasta ekleme sayfasına yönlendirme
                          console.log("Yeni hasta ekle");
                        }}
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Yeni Hasta Ekle
                      </Button>
                    </div>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* --- 2. FORM ALANLARI --- */}
          <fieldset disabled={!selectedPatient} className="space-y-4">
            {/* Tip ve Tarih */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium block mb-1">
                  Kayıt Tipi *
                </Label>
                <select
                  {...register("recordType", { required: true })}
                  className="w-full p-2 border border-border rounded-md bg-card text-foreground text-sm focus:ring-primary focus:border-primary"
                >
                  {RECORD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium block mb-1">
                  İşlem Tarihi
                </Label>
                <Input
                  type="date"
                  {...register("recordDate")}
                  className="bg-card border-border"
                />
              </div>
            </div>

            {/* Başlık */}
            <div>
              <Label className="text-sm font-medium block mb-1">
                Başlık (Örn: Diş Çekimi, Ödeme) *
              </Label>
              <Input
                type="text"
                {...register("title", {
                  required: "Başlık zorunludur",
                  maxLength: 100,
                })}
                placeholder="Kısa ve açıklayıcı bir başlık girin"
                className="bg-card border-border"
              />
              {errors.title && (
                <span className="text-destructive text-xs mt-1 block">
                  {errors.title.message}
                </span>
              )}
            </div>

            {/* Detaylar */}
            <div>
              <Label className="text-sm font-medium block mb-1">
                Detaylı Açıklama / Notlar
              </Label>
              <Textarea
                {...register("description")}
                placeholder="Tedavi notları veya detaylı açıklama..."
                className="bg-card border-border min-h-20"
              />
            </div>

            {/* FİNANSAL ALANLAR */}
            {(currentRecordType === "TREATMENT" ||
              currentRecordType === "PAYMENT") && (
              <div className="grid grid-cols-2 gap-4 border border-border p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <Label className="text-sm font-medium block mb-1">
                      Fiyat (Hastaya)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      className="bg-card border-border"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <Label className="text-sm font-medium block mb-1">
                      Maliyet (Kliniğe)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("cost")}
                      className="bg-card border-border"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          <DialogFooter className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" /> İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedPatient}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Kaydediliyor..." : "Kaydı Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
