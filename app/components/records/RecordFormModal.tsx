"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  patientRecordFormSchema,
  PatientRecordFormInput,
} from "@/lib/validations/patient-records";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import CalendarPicker from "../calendar/CalendarPicker";
import {
  Stethoscope,
  Save,
  X,
  DollarSign,
  Check,
  ChevronsUpDown,
  User,
  Plus,
  Trash2,
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

type PatientRecord = {
  id: string;
  record_date: string;
  title: string;
  record_type: string;
  price: number | null;
  description?: string | null;
  cost?: number | null;
  patient_id: string;
  patients?: {
    name: string;
  };
};

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientOption[];
  records: PatientRecord[];
  onLocalAdd: (record: any) => void;
  onLocalUpdate: (record: any) => void;
  onLocalDelete: (id: string) => void;
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
  onLocalAdd,
  onLocalUpdate,
  onLocalDelete,
  records,
}: RecordFormModalProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientRecordFormInput>({
    resolver: zodResolver(patientRecordFormSchema),
    defaultValues: {
      recordDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
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
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Takvimden seçilen tarihi tutmak için watch kullanılır
  const watchedRecordDate = watch("recordDate");
  // Modal kapandığında formu sıfırla
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedPatient(null);
      setIsEditing(false);
      setEditingRecordId(null); // <-- Mutlaka eklenmeli
    }
  }, [isOpen, reset]);

  const handleEventClick = (event: any) => {
    if (!event) {
      setIsEditing(false);
      reset({
        recordDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        recordType: "TREATMENT",
        title: "",
        description: "",
        price: "",
        cost: "",
      });
      setSelectedPatient(null);
      return;
    }

    setIsEditing(true);
    setEditingRecordId(event.id);
    const pId = event.extendedProps.patientId;
    const patient = patients.find((p) => p.id === pId);
    if (patient) setSelectedPatient(patient);

    setValue("title", event.title.split(" - ")[1] || event.title);
    setValue("recordType", event.extendedProps.type);
    setValue("recordDate", format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"));
    setValue("description", event.extendedProps.description || "");
    setValue("price", event.extendedProps.price?.toString() || "");
    setValue("cost", event.extendedProps.cost?.toString() || "");
  };

  const handleDateSelect = (value: string) => {
    const normalized = value.includes("T")
      ? value.slice(0, 16)
      : `${value}T10:00`;

    if (isEditing) {
      // DÜZENLEME MODUNDAYSA: Sadece saati güncelle (Taşıma işlemi)
      setValue("recordDate", normalized, { shouldDirty: true });
      toast.info("Randevu saati değiştirildi. Kaydetmeyi unutmayın.");
    } else {
      // YENİ KAYIT MODUNDAYSA: Formu o tarihle başlat
      setValue("recordDate", normalized);
    }
  };

  const handleDeleteRecord = async () => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;

    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `/api/records/delete-records?id=${editingRecordId}`
      );
      if (response.data.success) {
        toast.success("Başarıyla silindi");

        // Sayfayı yenilemek yerine parent'taki listeden sil:
        if (editingRecordId) onLocalDelete(editingRecordId);
      }
    } catch (err) {
      toast.error("Hata oluştu");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- KOMBOBOX İŞLEYİCİSİ ---
  const handlePatientSelect = (patient: PatientOption) => {
    setSelectedPatient(patient);
    setOpen(false);
  };

  const onSubmit = async (data: PatientRecordFormInput) => {
    if (!selectedPatient) {
      toast.error("Lütfen bir hasta seçin.");
      return;
    }

    // 1. Ortak payload hazırlığı
    const payload: any = {
      patientId: selectedPatient.id,
      clinicId: selectedPatient.clinic_id,
      recordType: data.recordType,
      recordDate: data.recordDate,
      title: data.title,
      description: data.description || null,
      price: data.price ? parseFloat(data.price) : null,
      cost: data.cost ? parseFloat(data.cost) : null,
    };

    if (isEditing && editingRecordId) {
      payload.recordId = editingRecordId;
    }

    try {
      // 2. API İsteği
      const response = isEditing
        ? await axios.put("/api/records/update-records", payload)
        : await axios.post("/api/records", payload);

      if (response.data.success) {
        // 3. API'den gelen güncel veri (Genellikle dizi içinde döner, o yüzden ilk elemanı alıyoruz)
        // Not: API tarafında .select() kullandığından emin olmalısın ki veri geri dönsün.
        const resultData = response.data.data?.[0] || response.data.data;

        // 4. Local State Manipülasyonu (Reload yerine)
        if (isEditing) {
          onLocalUpdate(resultData); // Mevcut randevuyu takvimde güncelle
        } else {
          onLocalAdd(resultData); // Yeni randevuyu takvime ekle
        }

        toast.success(
          response.data.message ||
            (isEditing ? "Kayıt güncellendi." : "Kayıt oluşturuldu.")
        );
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error("Randevu çakışması var! Lütfen başka bir saat seçin.");
      } else {
        toast.error(err.response?.data?.message || "Bir hata oluştu.");
      }
    }
  };

  const currentRecordType = watch("recordType");

  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1600px] bg-card p-6 max-h-[98vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            Yeni Klinik İşlem Kaydı ve Planlama
          </DialogTitle>
          <DialogDescription>
            Hastaya ait yeni tedavi, ödeme veya not kaydını buradan
            planlayabilir ve ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* --- 1. BÖLÜM: HASTA SEÇİMİ --- */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 transition-all shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-primary" />
                  <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                    Hasta Bilgileri *
                  </Label>
                </div>

                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between h-12 text-md shadow-sm border-input bg-card hover:border-primary/50 transition-all"
                    >
                      {selectedPatient ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                            {selectedPatient.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-foreground">
                            {selectedPatient.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-2 font-normal">
                          <User className="w-4 h-4 opacity-50" />
                          Hasta Seçiniz...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[400px] p-0 shadow-xl border-border bg-popover"
                    align="start"
                  >
                    <Command className="bg-transparent">
                      <CommandInput
                        placeholder="Hasta ara..."
                        className="h-11 border-none focus:ring-0"
                      />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                          Hasta bulunamadı.
                        </CommandEmpty>
                        <CommandGroup
                          heading="Kayıtlı Hastalar"
                          className="text-muted-foreground px-2"
                        >
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={`${patient.name} ${patient.phone || ""}`}
                              onSelect={() => handlePatientSelect(patient)}
                              className="py-3 rounded-md aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-primary",
                                  selectedPatient?.id === patient.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {patient.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {patient.phone || "Telefon kaydı yok"}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <div className="p-2 border-t border-border bg-muted/30">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-start text-primary h-10 text-sm font-semibold hover:bg-primary/10 transition-colors"
                          onClick={() => console.log("Yeni hasta ekle")}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Yeni Hasta Tanımla
                        </Button>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>

                {!selectedPatient && (
                  <p className="text-destructive text-xs font-medium mt-2 ml-1">
                    Hasta seçimi zorunludur
                  </p>
                )}
              </div>

              {/* --- 2. BÖLÜM: İŞLEM DETAYLARI --- */}
              <fieldset
                disabled={!selectedPatient}
                className={cn(
                  "space-y-5 transition-all duration-300",
                  !selectedPatient
                    ? "opacity-40 grayscale-[0.3]"
                    : "opacity-100"
                )}
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-primary rounded-full opacity-80" />
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                    Randevu & İşlem Detayları
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-foreground/80 ml-1">
                      Kayıt Tipi *
                    </Label>
                    <select
                      {...register("recordType")}
                      className="w-full h-11 px-3 border border-input rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all outline-none cursor-pointer shadow-sm"
                    >
                      {RECORD_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.recordType && (
                      <span className="text-destructive text-[11px] font-medium mt-1 ml-1 block">
                        {errors.recordType.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-foreground/80 ml-1">
                      İşlem Tarihi *
                    </Label>
                    <Input
                      type="datetime-local"
                      {...register("recordDate")}
                      className="h-11 bg-card border-input focus:ring-2 focus:ring-ring/20 shadow-sm"
                      readOnly={!isMobile}
                    />
                    {errors.recordDate && (
                      <span className="text-destructive text-[11px] font-medium mt-1 ml-1 block">
                        {errors.recordDate.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-foreground/80 ml-1">
                    İşlem Başlığı *
                  </Label>
                  <Input
                    type="text"
                    {...register("title")}
                    placeholder="Örn: Diş Çekimi..."
                    className="h-11 bg-card border-input focus:ring-2 focus:ring-ring/20 shadow-sm"
                  />
                  {errors.title && (
                    <span className="text-destructive text-[11px] font-medium mt-1 ml-1 block">
                      {errors.title.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-foreground/80 ml-1">
                    Klinik Notları
                  </Label>
                  <Textarea
                    {...register("description")}
                    placeholder="Notlar..."
                    className="bg-card border-input focus:ring-2 focus:ring-ring/20 min-h-[100px] shadow-sm resize-none p-3"
                  />
                  {errors.description && (
                    <span className="text-destructive text-[11px] font-medium mt-1 ml-1 block">
                      {errors.description.message}
                    </span>
                  )}
                </div>

                {/* --- 3. BÖLÜM: FİNANSAL ALANLAR --- */}
                {(currentRecordType === "TREATMENT" ||
                  currentRecordType === "PAYMENT") && (
                  <div className="bg-muted/20 border border-border p-4 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Finansal Veriler
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-bold text-muted-foreground ml-1">
                          Fiyat (Hasta){" "}
                          {currentRecordType === "TREATMENT" && "*"}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">
                            ₺
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            {...register("price")}
                            className="pl-8 h-11 bg-card border-input focus:ring-2 focus:ring-ring/20 font-semibold text-foreground"
                            placeholder="0.00"
                          />
                        </div>
                        {errors.price && (
                          <span className="text-destructive text-[11px] font-medium mt-1 ml-1 block">
                            {errors.price.message}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[12px] font-bold text-muted-foreground ml-1">
                          Liste Fiyatı (Maliyet)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                            ₺
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            {...register("cost")}
                            className="pl-8 h-11 bg-card border-input focus:ring-2 focus:ring-ring/20"
                            placeholder="0.00"
                          />
                        </div>
                        {errors.cost && (
                          <span className="text-destructive text-[11px] font-medium mt-1 ml-1 block">
                            {errors.cost.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </fieldset>

              {/* --- FOOTER / ACTIONS --- */}
              {/* --- FOOTER / ACTIONS --- */}
              <div className="pt-6 mt-2 flex items-center justify-between border-t border-border/60 bg-muted/5 px-1">
                {/* Sol Taraf: Silme Butonu (Yıkıcı Eylem) */}
                <div className="flex-1">
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={handleDeleteRecord}
                      variant="ghost"
                      disabled={isSubmitting || isDeleting || !selectedPatient}
                      className={cn(
                        "h-11 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold transition-all group",
                        "disabled:opacity-30 disabled:grayscale"
                      )}
                    >
                      {isDeleting ? (
                        <span className="flex items-center gap-2 text-sm">
                          <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                          İşleniyor
                        </span>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline">Kaydı Sil</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Sağ Taraf: İkincil ve Birincil Eylemler */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting || isDeleting}
                    className="h-11 px-5 border-border hover:bg-accent text-muted-foreground font-medium transition-colors"
                  >
                    <X className="w-4 h-4 mr-2 opacity-70" />
                    Vazgeç
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedPatient || isDeleting}
                    className={cn(
                      "h-11 px-6 font-bold shadow-lg transition-all active:scale-[0.98]",
                      isEditing
                        ? "bg-info text-white hover:bg-info/80 shadow-info-500/20"
                        : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20"
                    )}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="animate-pulse">Kaydediliyor</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4 opacity-90" />
                        {isEditing
                          ? "Değişiklikleri Kaydet"
                          : "Randevuyu Onayla"}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* SAĞ SÜTUN (TAKVİM) - 2/3 ORANINDA KULLANILACAK */}
          <div className="lg:col-span-2 pl-4 hidden lg:block">
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Planlama Takvimi
            </h3>
            <CalendarPicker
              selectedDate={watchedRecordDate}
              onSelectDate={handleDateSelect}
              onEventClick={handleEventClick}
              records={records}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};