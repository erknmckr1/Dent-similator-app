"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  UserCog,
  ShieldCheck,
  Mail,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssignmentModal } from "@/app/components/settings/personel-management/AssignmentModal";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
export default function PersonelManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [personelDatas, setPersonelDatas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSecretary, setSelectedSecretary] = useState<any>(null);

  const getPersonelDatas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/personel/get-personels");
      const data = await response.json();
      setPersonelDatas(data.data || []);
    } catch (err) {
      console.error("Hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPersonelDatas();
  }, []);

  // Arama filtresi
  const filteredPersonel = useMemo(() => {
    return personelDatas.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, personelDatas]);

  // İstatistikler için basit hesaplamalar
  const stats = useMemo(() => {
    return {
      total: personelDatas.length,
      doctors: personelDatas.filter((p) => p.role === "doctor").length,
    };
  }, [personelDatas]);

  // SADECE DOKTORLARI FİLTRELE (Modal içinde listelemek için)
  const allDoctors = useMemo(() => {
    return personelDatas.filter((p) => p.role === "doctor");
  }, [personelDatas]);

  // ATAMA BUTONUNA TIKLANDIĞINDA
  const handleOpenAssignment = (personel: any) => {
    setSelectedSecretary(personel);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-background min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Personel Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Klinik çalışanlarını listeleyin, rollerini ve doktor atamalarını
            yönetin.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:opacity-90 shadow-md transition-all active:scale-95 px-6">
          <UserPlus className="w-4 h-4 mr-2" />
          Personel Davet Et
        </Button>
      </div>

      {/* QUICK STATS */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Toplam Personel
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : stats.total}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Aktif Doktorlar
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : stats.doctors}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH & TABLE SECTION */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim veya e-posta ile ara..."
                className="pl-9 bg-background border-input focus:ring-primary/20 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="font-bold text-foreground py-4 px-6">
                  Personel Bilgisi
                </TableHead>
                <TableHead className="font-bold text-foreground">Rol</TableHead>
                <TableHead className="font-bold text-foreground">
                  Durum
                </TableHead>
                <TableHead className="font-bold text-foreground">
                  Bağlı Doktorlar
                </TableHead>
                <TableHead className="text-right px-6 font-bold text-foreground">
                  İşlemler
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-y-auto">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Personel verileri yükleniyor...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPersonel.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground text-sm"
                  >
                    Personel bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersonel.map((personel) => (
                  <TableRow
                    key={personel.id}
                    className="border-border hover:bg-accent/50 transition-colors group"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-border shadow-sm">
                          <AvatarFallback className="bg-secondary text-secondary-foreground font-bold uppercase">
                            {personel.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {personel.name}
                          </span>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Mail className="w-3 h-3 mr-1" /> {personel.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "border-0 font-semibold px-2 py-0.5",
                          personel.role === "doctor"
                            ? "bg-primary/10 text-primary"
                            : "bg-info/10 text-info"
                        )}
                      >
                        {personel.role === "doctor"
                          ? "Doktor"
                          : personel.role === "secretary"
                          ? "Sekreter"
                          : personel.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            personel.is_active
                              ? "bg-primary"
                              : "bg-muted-foreground"
                          )}
                        />
                        <span className="text-xs font-medium">
                          {personel.is_active ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {personel.role === "secretary" ? (
                          personel.secretary_doctor_assignments?.length > 0 ? (
                            personel.secretary_doctor_assignments.map(
                              (assignment: any, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-secondary text-secondary-foreground text-[10px] font-bold border-0"
                                >
                                  {assignment.doctor?.name ||
                                    "Bilinmeyen Doktor"}
                                </Badge>
                              )
                            )
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Atama yok
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      {personel.role === "secretary" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleOpenAssignment(personel)}
                        >
                          <UserCog className="w-5 h-5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* DOKTOR ATAMA MODALI */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSecretary(null);
        }}
        secretary={selectedSecretary}
        allDoctors={allDoctors}
        onSuccess={getPersonelDatas} // İşlem başarılı olunca listeyi yenile
      />
    </div>
  );
}
