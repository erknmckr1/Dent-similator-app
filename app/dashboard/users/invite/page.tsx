// AdminPanel/InviteUserForm.tsx (Client Component)
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react"; // npm install lucide-react

export default function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("doctor"); // Varsayılan rol
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Davet oluşturuluyor...");
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/invite", { email, role });
      if (response.status === 200) {
        alert("Davet linki başarıyla gönderildi.");
      }
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-between py-20 ">
      <div className="max-w-xl h-full mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Personel Davet Et
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Yeni bir doktor veya personel eklemek için e-posta ve rol ataması
          yapın.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-6">
          {/* E-posta Alanı */}
          <div className="grid gap-2">
            <Label htmlFor="email">Davet Edilecek E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@doktor.com"
              required
            />
          </div>

          {/* Rol Alanı */}
          <div className="grid gap-2">
            <Label htmlFor="role">Rol Ataması</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rol Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">🦷 Doktor</SelectItem>
                <SelectItem value="staff">👩🏻‍💻 Klinik Personeli</SelectItem>
                <SelectItem value="marketing">📢 Pazarlama</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buton */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Davet Oluşturuluyor...
              </span>
            ) : (
              "Davet Gönder"
            )}
          </Button>
        </form>

        {/* Mesaj Alanı */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.startsWith("Hata:")
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
