"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import axios from "axios";
export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    clinicName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post("/api/auth/register-admin", formData);

      if (response.status === 200) {
        toast.success("Kayıt başarılı! Giriş yapabilirsiniz.");
        router.push("/auth/login");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error || "Kayıt sırasında bir hata oluştu."
      );
    }
  };
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      {/* SOL TARAFA: FORM ALANI */}
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">DentVision `a Katılın</h1>
            <p className="text-balance text-muted-foreground">
              Klinik yönetiminizi yapay zeka ile güçlendirmek için hesabınızı
              oluşturun.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }}
            className="grid gap-4"
          >
            {/* 1. Klinik ve Yönetici Bilgileri */}
            <div className="grid gap-2">
              <Label htmlFor="clinicName">Klinik Adı</Label>
              <Input
                id="clinicName"
                placeholder="Örn: DentVision Ağız ve Diş Sağlığı"
                required
                value={formData.clinicName}
                onChange={handleChange}
                name="clinicName"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullName">Yönetici Adı Soyadı</Label>
              <Input
                onChange={handleChange}
                id="fullName"
                placeholder="Dr. Ahmet Yılmaz"
                required
                value={formData.fullName}
                name="fullName"
              />
            </div>

            {/* 2. İletişim Bilgileri */}
            <div className="grid gap-2">
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@klinik.com"
                required
                value={formData.email}
                onChange={handleChange}
                name="email"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon Numarası</Label>
              <Input
                onChange={handleChange}
                value={formData.phone}
                id="phone"
                type="tel"
                placeholder="0555 555 55 55"
                name="phone"
              />
            </div>

            {/* 3. Güvenlik */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  onChange={handleChange}
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  name="password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input
                  onChange={handleChange}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  type="password"
                  required
                  name="confirmPassword"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800"
            >
              Hesap Oluştur
            </Button>

            <Button variant="outline" className="w-full">
              Google ile Devam Et
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Zaten bir hesabınız var mı?{" "}
            <Link
              href="/auth/login"
              className="underline font-medium text-gray-900"
            >
              Giriş Yap
            </Link>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-2">
            Kayıt olarak{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Hizmet Şartları
            </Link>{" "}
            ve{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Gizlilik Politikası
            </Link>
            nı kabul etmiş olursunuz.
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: GÖRSEL ALANI */}
      <div className="hidden bg-muted lg:block relative">
        {/* Buraya az önce ürettiğimiz temiz, logosuz görseli koyacağız */}
        <img
          src="/loginbnn.jpg" // Projenin public klasörüne koyduğun görsel yolu
          alt="Dental Clinic AI"
          className="h-full w-full object-cover"
        />

        {/* Görselin üzerine hafif bir karartma ve slogan ekleyebiliriz */}
        <div className="absolute inset-0 bg-black/20 flex items-end p-20">
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-4">Gülüşleri Dönüştürün.</h2>
            <p className="text-lg opacity-90">
              Saniyeler içinde profesyonel simülasyonlar oluşturun ve hasta
              memnuniyetini artırın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
