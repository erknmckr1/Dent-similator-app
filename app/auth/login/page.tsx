"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import axios from "axios";
import { supabase } from "@/lib/supabase/supabase"; // Anon Key Client

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // --- Yardımcı Fonksiyonlar ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Kullanıcı yazmaya başladığında hata/onay durumunu sıfırla
    setError(null);
    setNeedsConfirmation(false);
  };
  
  const handleResendConfirmation = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: formData.email,
      });

      if (resendError) {
        // Hata durumunda sadece error state'ini güncelle
        setError(`Tekrar gönderme başarısız: ${resendError.message}`);
        setNeedsConfirmation(false); // Butonu tekrar gizle
        return;
      }

      // Başarılı mesajı göster
      alert(
        `Onay e-postası başarıyla ${formData.email} adresine tekrar gönderildi. Spam/Gereksiz klasörünüzü kontrol edin.`
      );
      setNeedsConfirmation(false); // Başarılı gönderim sonrası butonu gizle
    } catch (err) {
      console.error(err);
      setError("E-posta gönderme sırasında beklenmedik bir ağ hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);

    try {
      const response = await axios.post("/api/auth/login", formData);

      if (response.status === 200) {
        alert("Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz.");
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Giriş sırasında bir hata oluştu:", err);
      setNeedsConfirmation(true);
      if (axios.isAxiosError(err) && err.response) {
        // Hata mesajını büyük/küçük harf duyarlılığını azaltarak alıyoruz
        const rawErrorMessage = err.response.data.error || "";
        const lowerCaseError = String(rawErrorMessage).toLowerCase();

        // Eğer errorMessage bir string değilse, doğrudan "Giriş başarısız oldu" dönecek.
        const displayMessage = rawErrorMessage || "Giriş başarısız oldu.";

        // E-posta onaylanmamış hatasını özel olarak yakala
        if (lowerCaseError && lowerCaseError.includes("email not confirmed")) {
          setError(
            "E-posta adresiniz onaylanmamış. Lütfen gelen kutunuzu kontrol edin."
          );
          setNeedsConfirmation(true);
        } else {
          // Diğer tüm hataları (Yanlış şifre, vb.) göster
          setError(displayMessage);
        }
      } else {
        setError("Giriş sırasında beklenmedik bir ağ hatası oluştu.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">DentVision a Hoş Geldiniz</h1>
            <p className="text-balance text-muted-foreground">
              Giriş yapmak için e-posta adresinizi ve şifrenizi girin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* E-posta Input */}
            <div className="grid gap-2">
              <Label htmlFor="email">Kullanıcı Adı</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@klinik.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Şifre Input */}
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Şifre</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Şifrenizi mi unuttunuz?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>

          {/* HATA VE TEKRAR GÖNDERME ALANI */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
              <p className="mb-2 font-medium">{error}</p>

              {needsConfirmation && (
                <Button
                  onClick={handleResendConfirmation}
                  variant="ghost"
                  className="w-full mt-2 text-red-700 hover:bg-red-200"
                  disabled={loading}
                >
                  {loading ? "Gönderiliyor..." : "Onay Mailini Tekrar Gönder"}
                </Button>
              )}
            </div>
          )}

          {/* Kayıt Ol Linki */}
          <div className="mt-4 text-center text-sm">
            Hesabınız yok mu?{" "}
            <Link href="/auth/register" className="underline">
              Kayıt Ol
            </Link>
          </div>

          {/* Şartlar ve Politikalar */}
          <div className="text-center text-sm text-muted-foreground mt-4">
            Devam ederek,{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Hizmet Şartları
            </Link>{" "}
            ve{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Gizlilik Politikası
            </Link>
            nı kabul etmiş olursunuz.
          </div>
        </div>
      </div>
      {/* Sağ Görsel Alanı */}
      <div className="hidden border-16 border-blue-400 bg-muted lg:block">
        <img
          src="/loginbnn.jpg"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
