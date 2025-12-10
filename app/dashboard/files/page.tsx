// app/dashboard/files/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Folder, User as UserIcon } from 'lucide-react';

// Tip tanımı
interface Patient {
    id: string; 
    name: string; 
    phone: string | null;
}

export default async function FilesPage() {
    // 1. Yetkilendirme Kontrolü
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }
    const authUserId = user.id;

    // 2. Kullanıcının Klinik ID'sini ve Hastalarını Çekme
    // Bu veri çekimi, Studio/page.tsx'teki ile aynıdır.
    const { data: userData } = await supabase
        .from("users")
        .select("clinic_id")
        .eq("auth_user_id", authUserId)
        .single();
    
    const clinicId = userData?.clinic_id;
    let patients: Patient[] = [];

    if (clinicId) {
        const { data: patientsData, error } = await supabase
            .from("patients")
            // Sadece listeleme için gerekli alanları seçiyoruz
            .select(`id, name, phone`) 
            .eq("clinic_id", clinicId)
            .eq("assigned_doctor", authUserId)
            .order("name", { ascending: true });

        if (error) {
            console.error("Hasta listesi çekilemedi:", error.message);
        } else {
            patients = patientsData || [];
        }
    }

    return (
        <div className="p-8 max-w-7xl h-screen overflow-y-auto mx-auto">
            <h1 className="text-3xl font-bold mb-6">📂 Hasta Dosyaları</h1>
            <p className="text-muted-foreground mb-8">
                Size atanan hastaların görsel geçmişine buradan erişebilirsiniz.
            </p>
            
            {patients.length === 0 ? (
                <p className="text-gray-500">Henüz size atanmış hasta kaydı bulunmamaktadır.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {patients.map((patient) => (
                        // Her hasta, detay sayfasına giden bir klasör olarak tasarlanır
                        <Link 
                            key={patient.id} 
                            href={`/dashboard/files/${patient.id}`} 
                            className="bg-card border rounded-lg p-4 transition-all hover:shadow-lg hover:border-primary/50 flex flex-col items-start"
                        >
                            <Folder className="w-8 h-8 text-yellow-600 fill-yellow-200 mb-3" />
                            <h2 className="text-lg font-semibold truncate w-full">{patient.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <UserIcon className="w-3 h-3"/> {patient.phone || 'Telefon Yok'}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}