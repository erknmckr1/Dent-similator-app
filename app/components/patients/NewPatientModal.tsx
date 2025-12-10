import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { X, Loader2, UserPlus } from "lucide-react";
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
import axios from "axios";
import { toast } from "sonner";

type NewPatientFormModal = {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  doctorPkId: string;
  onSuccess?: () => void; // Başarılı kayıt sonrası callback
};

interface RecordFormData {
  clinic_id: string;
  assigned_doctor: string;
  name: string;
  phone: string;
  gender: string;
  birthdate: string;
  notes: string;
  national_id_no: string;
}

function NewPatientModal({
  isOpen,
  onClose,
  doctorPkId,
  clinicId,
  onSuccess,
}: NewPatientFormModal) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecordFormData>({
    defaultValues: {
      clinic_id: clinicId,
      assigned_doctor: doctorPkId,
      name: "",
      phone: "",
      gender: "",
      birthdate: "",
      notes: "",
      national_id_no: "",
    },
  });

  const onSubmit = async (data: RecordFormData) => {
    setIsLoading(true);
    try {
      // Backend'e POST isteği
      const response = await axios.post("/api/patients/add-new-patients", {
        clinic_id: data.clinic_id,
        assigned_doctor: data.assigned_doctor,
        national_id_no: data.national_id_no,
        name: data.name.trim(),
        phone: data.phone.trim(),
        gender: data.gender,
        birthdate: data.birthdate || null,
        notes: data.notes?.trim() || null,
      });
      if (response.data.success) {
        toast.success("Hasta kaydı başarıyla oluşturuldu.");
        onSuccess?.()
      } else if (response.data.success) {
        toast.error(response.data.message);
      } else {
        toast.error("Hasta kaydı oluşturulamadı.");
      }

      // Başarılı kayıt
      toast.success("Hasta başarıyla eklendi!");

      // Form'u sıfırla
      reset();

      // Modal'ı kapat
      onClose();
    } catch (err) {
      console.error("Hasta eklenirken hata:", err);

      // Hata mesajı göster
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Hasta eklenirken bir hata oluştu"
        : "Beklenmeyen bir hata oluştu";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-card p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Yeni Hasta Ekle
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Yeni hasta kaydını buradan ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="border border-border rounded-lg p-4 bg-background/50">
            <fieldset className="space-y-4" disabled={isLoading}>
              {/* İsim ve Telefon */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    İsim *
                  </Label>
                  <Input
                    placeholder="Hasta İsmi"
                    {...register("name", {
                      required: "İsim gerekli",
                      minLength: {
                        value: 2,
                        message: "İsim en az 2 karakter olmalı",
                      },
                    })}
                    className="bg-card border-border"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Telefon *
                  </Label>
                  <Input
                    placeholder="5XX XXX XX XX"
                    {...register("phone", {
                      required: "Telefon gerekli",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message:
                          "Geçerli bir telefon numarası girin (10 rakam)",
                      },
                    })}
                    className="bg-card border-border"
                    maxLength={10}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
              {/* id_no */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Kimlik No *
                  </Label>
                  <Input
                    placeholder="Kimlik No"
                    {...register("national_id_no", {
                      required: "Kimlik No gerekli",
                      //  RegEx Kontrolü: 11 Rakam Olmalı
                      pattern: {
                        value: /^\d{11}$/,
                        message: "Kimlik No sadece 11 haneli sayı olmalıdır.",
                      },
                    })}
                    className="bg-card border-border"
                  />
                  {errors.national_id_no && (
                    <p className="text-xs text-destructive">
                      {errors.national_id_no.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2"></div>
              </div>

              {/* Cinsiyet ve Doğum Tarihi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Cinsiyet *
                  </Label>
                  <select
                    {...register("gender", { required: "Cinsiyet gerekli" })}
                    className="w-full p-2 border border-border rounded-md bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="">Cinsiyet Seçiniz</option>
                    <option value="Male">Erkek</option>
                    <option value="Female">Kadın</option>
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-destructive">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Doğum Tarihi
                  </Label>
                  <Input
                    type="date"
                    {...register("birthdate")}
                    className="bg-card border-border"
                    max={new Date().toISOString().split("T")[0]} // Bugünden ileri tarih seçilemesin
                  />
                </div>
              </div>

              {/* Notlar */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Detaylı Açıklama / Notlar
                </Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Tedavi notları veya detaylı açıklama..."
                  className="bg-card border-border min-h-24 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {watch("notes")?.length || 0}/500 karakter
                </p>
              </div>
            </fieldset>
          </div>

          {/* Form Butonları */}
          <DialogFooter className=" gap-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Hastayı Kaydet"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewPatientModal;
