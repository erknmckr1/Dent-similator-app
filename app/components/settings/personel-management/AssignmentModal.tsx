"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretary: any;
  allDoctors: any[];
  onSuccess: () => void;
}

export function AssignmentModal({
  isOpen,
  onClose,
  secretary,
  allDoctors,
  onSuccess,
}: AssignmentModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);


  // Modal açıldığında sekreterin mevcut atamalarını state'e yükle
  useEffect(() => {
    if (isOpen && secretary) {
      const currentIds =
        secretary.secretary_doctor_assignments?.map(
          (a: any) => a.doctor_id || a.doctor?.id
        ) || [];
      setSelectedIds(currentIds);
    }
  }, [isOpen, secretary]);

  const handleToggle = (doctorId: string) => {
    setSelectedIds((prev) =>
      prev.includes(doctorId)
        ? prev.filter((id) => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/personel/assign-doctors", {
        method: "POST",
        body: JSON.stringify({
          secretaryId: secretary.id,
          doctorIds: selectedIds,
          clinicId: secretary.clinic_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Atamalar güncellendi.");
        setSelectedIds([]);
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
      setSelectedIds([]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-muted/20 border-b border-border">
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Doktor Atamalarını Yönet
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-bold text-foreground">{secretary?.name}</span>{" "}
            adlı sekreterin sorumlu olduğu doktorları seçin.
          </p>
        </DialogHeader>

        <div className="p-6">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {allDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => handleToggle(doctor.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {doctor.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {doctor.email}
                    </span>
                  </div>
                  <Checkbox
                    checked={selectedIds.includes(doctor.id)}
                    onCheckedChange={() => handleToggle(doctor.id)}
                    className="border-primary data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
              {allDoctors.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-10">
                  Klinikte henüz doktor bulunamadı.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t border-border flex items-center gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Vazgeç
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:opacity-90 font-bold px-8"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Değişiklikleri Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
