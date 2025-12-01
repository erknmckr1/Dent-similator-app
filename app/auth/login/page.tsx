import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
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
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Kullanıcı Adı</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@klinik.com"
                required
              />
            </div>
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
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Giriş Yap
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Hesabınız yok mu?{" "}
            <Link href="/signup" className="underline">
              Kayıt Ol
            </Link>
          </div>
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
