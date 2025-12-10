"use client";

import React, { useState } from "react";
import axios from "axios";
import { UploadZone } from "@/app/components/studio/UploadZone";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Loader2,
  ArrowRight,
  Check,
  ChevronsUpDown,
  User,
  Plus,
} from "lucide-react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { cn } from "@/lib/utils";

// --- SHADCN COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { Switch } from "@/components/ui/switch";
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
import MaskingCanvas from "@/app/components/studio/MakingCanvas";

// --- 1. CONSTANTS & TYPES ---
type SimulationType = "whiten" | "veneer" | "align";

interface subMethods {
  id: string;
  label: string;
  prompt: string;
}

interface SimulationOption {
  id: SimulationType;
  label: string;
  prompt: string | null;
  subMethods: subMethods[] | null;
  description: string;
  icon: React.ElementType;
}

// Yeni hali (AI Studio kodunun en üstüne koyulacak)
const SIMULATION_OPTIONS: SimulationOption[] = [
  {
    id: "whiten",
    label: "Diş Beyazlatma",
    icon: Sparkles,
    description: "Doğal ve parlak beyazlık",
    prompt:
      "Bright white teeth, natural texture, gleaming smile, dental photography",
    subMethods: null, // Alt seçenek yok
  },
  {
    id: "veneer",
    label: "Hollywood Smile",
    description: "Tamamen yeni gülüş tasarımı",
    icon: Wand2,
    prompt:
      "Perfectly aligned dental veneers, ceramic texture, symmetric teeth, high quality",
    subMethods: null,
  },
  {
    id: "align",
    label: "Hizalama",
    icon: ImageIcon,
    description: "Çapraşık diş düzeltme",
    prompt: null, // Ana kategori, prompt alt seçeneklerde belirlenecek
    subMethods: [
      // Alt seçenekler
      {
        id: "final",
        label: "Düzeltilmiş Nihai Sonuç",
        prompt:
          "Perfectly aligned straight natural teeth, no gaps, no crowding, bright smile, natural white color, dental photography.",
      },
      {
        id: "braces",
        label: "Geleneksel Diş Teli",
        prompt:
          "Traditional metal braces applied to the upper and lower teeth, clean brackets, detailed wires, realistic appearance.",
      },
    ],
  },
];

// --- 2. SUB-COMPONENTS (Alt Bileşenler) ---

/**
 * Tedavi Tipi Seçici
 */
const TypeSelector = ({
  selected,
  onSelect,
}: {
  selected: SimulationOption;
  onSelect: (id: SimulationOption) => void;
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {SIMULATION_OPTIONS.map((option) => (
        <div
          key={option.id}
          onClick={() => onSelect(option)}
          className={cn(
            "cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md flex flex-col items-center text-center gap-2",
            selected.id === option.id
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          <option.icon
            className={cn(
              "w-5 h-5",
              selected.id === option.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          />
          <div>
            <div className="text-sm font-medium leading-none">
              {option.label}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {option.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Sonuç Gösterici
 */
const ResultDisplay = ({
  status,
  originalUrl,
  resultUrl,
}: {
  status: "idle" | "processing" | "success";
  originalUrl: string | null;
  resultUrl: string | null;
}) => {
  if (status === "processing") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="text-lg font-semibold">Yapay Zeka Çalışıyor</h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-2">
          Gülüş analizi yapılıyor, dişler tespit ediliyor ve simülasyon
          uygulanıyor...
        </p>
      </div>
    );
  }

  if (status === "success" && originalUrl && resultUrl) {
    return (
      <div className="h-full w-full relative group">
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={originalUrl} alt="Original" />}
          itemTwo={<ReactCompareSliderImage src={resultUrl} alt="AI Result" />}
          className="h-full w-full object-contain"
        />
        <Badge className="absolute top-4 left-4 z-10 bg-black/70 hover:bg-black/70">
          Öncesi
        </Badge>
        <Badge className="absolute top-4 right-4 z-10 bg-primary hover:bg-primary">
          Sonrası (AI)
        </Badge>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Kıyaslamak için sürükleyin
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-muted/10">
      <div className="flex -space-x-4 mb-6">
        {[Sparkles, Wand2, ImageIcon].map((Icon, i) => (
          <div
            key={i}
            className={cn(
              "w-12 h-12 animate-bounce rounded-xl border-4 border-background flex items-center justify-center shadow-sm text-white",
              i === 0
                ? "bg-blue-500 z-30"
                : i === 1
                ? "bg-indigo-500 z-20"
                : "bg-purple-500 z-10"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        ))}
      </div>
      <h3 className="text-xl font-bold text-foreground">Sonuç Ekranı</h3>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Simülasyon başlatıldığında üretilen sonuç burada anlık olarak
        görüntülenecektir.
      </p>
    </div>
  );
};

// --- 3. MAIN COMPONENT (Ana Sayfa) ---

type PatientProp = {
  value: string;
  label: string;
  phone: string;
};

export default function DentalSimulator({
  patients,
}: {
  patients: PatientProp[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // --- HASTA SEÇİMİ (LAZY INIT ile hata önlendi) ---
  const [open, setOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return searchParams.get("patientId") || "";
  });

  // --- SİMÜLATÖR STATE'LERİ ---
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SimulationOption>({
    id: "whiten",
    label: "Diş Beyazlatma",
    icon: Sparkles,
    description: "Doğal ve parlak beyazlık",
    prompt:
      "Create bright Hollywood-white teeth while keeping the natural texture of enamel. Completely remove yellowing, stains, and dullness. Increase luminance and contrast on the teeth only. Do NOT alter shape, gums, lips, or alignment. Only whitening to a premium aesthetic level..",
    subMethods: null,
  });
  const [status, setStatus] = useState<"idle" | "processing" | "success">(
    "idle"
  );
  const [selectedMethod, setSelectedMethod] = useState<subMethods | null>(null);
  const [isMaskingEnabled, setIsMaskingEnabled] = useState(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.value === selectedPatientId);

  // --- HANDLERS ---

  // Hasta Seçim Mantığı ve URL Güncelleme
  const handlePatientSelect = (patientValue: string) => {
    const newId = patientValue === selectedPatientId ? "" : patientValue;

    // 1. State Güncelle
    setSelectedPatientId(newId);
    setOpen(false);

    // 2. URL Güncelle
    const params = new URLSearchParams(searchParams.toString());
    if (newId) {
      params.set("patientId", newId);
    } else {
      params.delete("patientId");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResultUrl(null);
    setStatus("idle");
  };

  const handleUrlSelect = (url: string) => {
    setFile(null);
    setPreviewUrl(url);
    setResultUrl(null);
    setStatus("idle");
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setStatus("idle");
    setMaskDataUrl(null); // Maskeyi temizle
    setIsMaskingEnabled(false); // Maske özelliğini kapat
  };

  const handleGenerate = async () => {
    if (!file) {
      alert("Lütfen bir fotoğraf yükleyin.");
      return;
    }

    // Alt Seçeneklerden Seçili Olanın Prompt'unu Bulur
    const currentMethodPrompt = selectedType?.subMethods
      ? selectedType.subMethods.find((m) => m.id === selectedMethod?.id)?.prompt
      : selectedType?.prompt; // Alt seçenek yoksa, ana prompt'u kullan

    if (!currentMethodPrompt) {
      alert("Lütfen geçerli bir tedavi yöntemi seçin.");
      return;
    }

    setStatus("processing");

    // backend e gönderilecek veriler
    const formData = new FormData();
    formData.append("originalImage", file);
    formData.append("prompt", currentMethodPrompt);
    formData.append("patientId", selectedPatientId);
    formData.append("simulationType", selectedType.id);

    // api isteği
    try {
      const response = await axios.post("/api/generate_image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });

      const data = response.data;
      setResultUrl(data.resultUrl);
      setStatus("success");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-10 flex flex-col items-center">
      {/* --- HEADER & HASTA SEÇİCİ --- */}
      <div className="w-full max-w-6xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Diş Stüdyosu
          </h1>
          <p className="text-muted-foreground">
            Yeni bir gülüş simülasyonu başlatın.
          </p>
        </div>

        {/* HASTA COMBOBOX */}
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[300px] justify-between h-12 text-md shadow-sm border-gray-300 bg-white"
              >
                {selectedPatientId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200">
                      {selectedPatient?.label.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {selectedPatient?.label}
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
            <PopoverContent
              className="w-[300px] overflow-y-auto p-0"
              align="end"
            >
              <Command>
                <CommandInput placeholder="Hasta ara (isim veya tel)..." />
                <CommandList>
                  <CommandEmpty>Hasta bulunamadı.</CommandEmpty>
                  <CommandGroup heading="Hastalarım">
                    {patients.map((patient) => (
                      <CommandItem
                        key={patient.value}
                        value={patient.label}
                        onSelect={() => handlePatientSelect(patient.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPatientId === patient.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{patient.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {patient.phone}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="p-1 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-blue-600 h-8 text-sm hover:text-blue-700 hover:bg-blue-50"
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
      </div>

      {/* --- ANA SİMÜLATÖR ALANI --- */}
      {/* Hasta seçilmezse burası bulanıklaşır ve tıklanamaz olur bu bolum farklı bir div içerisinde de yapılabilir */}
      <div
        className={cn(
          "w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch transition-all duration-500",
          !selectedPatientId
            ? "opacity-40 blur-[2px] pointer-events-none grayscale-[0.5]"
            : "opacity-100"
        )}
      >
        {/* LEFT CARD: INPUTS */}
        <Card className="h-full shadow-lg border-border/60">
          <CardContent className="p-6 md:p-8 flex flex-col h-full gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Görsel Yükleme
              </h2>
              <p className="text-muted-foreground">
                Seçili hasta:{" "}
                <span className="font-semibold text-foreground">
                  {selectedPatient?.label || "Yok"}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <Label>1. Fotoğraf Yükle</Label>
              <UploadZone
                onFileSelect={handleFileSelect}
                onUrlSelect={handleUrlSelect}
                previewUrl={previewUrl}
                onClear={handleClear}
              />
            </div>
            {/* preview img */}
            {previewUrl && (
              <div className="flex items-center justify-between space-x-2 p-3 bg-secondary rounded-lg border animate-in fade-in duration-300">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="mask-toggle" className="text-sm font-medium">
                    Manuel Maskeleme
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Daha hassas sonuçlar için tedavi alanını işaretle.
                    (Opsiyonel)
                  </p>
                </div>
                <Switch
                  id="mask-toggle"
                  checked={isMaskingEnabled}
                  onCheckedChange={(checked) => {
                    setIsMaskingEnabled(checked);
                    if (!checked) {
                      setMaskDataUrl(null); // Kapanırsa maske verisini temizle
                    }
                  }}
                  disabled={status === "processing"}
                />
              </div>
            )}

            {/* KOŞULLU RENDER: Maskeleme Tuvali */}
            {previewUrl && isMaskingEnabled && (
              <>
                <Separator />
                {/* MaskingCanvas Kullanımı */}
                <MaskingCanvas
                  imageUrl={previewUrl}
                  onMaskComplete={setMaskDataUrl} // Çizilen maskeyi state'e kaydeder
                  isProcessing={status === "processing"}
                />
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <Label>2. Tedavi Seçimi</Label>
              <TypeSelector
                selected={selectedType}
                onSelect={(id) => {
                  setSelectedType(id);
                  setSelectedMethod(null);
                }}
              />
            </div>
            <Separator />
            {/* 3. YENİ BÖLÜM: Alt Yöntem Seçimi (Sadece Hizalama seçilince görünür) */}
            {selectedType && selectedType.subMethods && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label>3. Yöntem Seçimi</Label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedType.subMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-colors text-sm font-medium",
                        selectedMethod?.id === method.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-secondary/50 text-foreground"
                      )}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-auto pt-4">
              <Button
                size="lg"
                className="w-full text-md font-semibold h-12"
                onClick={handleGenerate}
                disabled={(!file && !previewUrl) || status === "processing"}
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Simülasyonu Başlat
                    <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT CARD: OUTPUT */}
        <Card className="h-full min-h-[500px] shadow-lg border-border/60 overflow-hidden bg-card/50">
          <CardContent className="p-0 h-full">
            <ResultDisplay
              status={status}
              originalUrl={previewUrl}
              resultUrl={resultUrl}
            />
          </CardContent>
        </Card>
      </div>

      {/* BLOKLAYICI MESAJ (Hasta seçilmediyse kullanıcıyı uyar) */}
      {!selectedPatientId && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce">
          <div className="bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-medium">
            👆 Lütfen başlamak için yukarıdan bir hasta seçin
          </div>
        </div>
      )}
    </div>
  );
}
