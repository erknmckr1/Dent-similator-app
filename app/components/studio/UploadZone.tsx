import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Link as LinkIcon,ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
export const UploadZone = ({
  onFileSelect,
  onUrlSelect,
  previewUrl,
  onClear,
}: {
  onFileSelect: (file: File) => void;
  onUrlSelect?: (url: string) => void;
  previewUrl: string | null;
  onClear: () => void;
}) => {
  const [urlInput, setUrlInput] = useState("");

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim() && onUrlSelect) {
      onUrlSelect(urlInput);
      setUrlInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUrlSubmit();
    }
  };

  // Önizleme Modu
  if (previewUrl) {
    return (
      <div className="relative w-full h-72 rounded-xl overflow-hidden border bg-black/5 group animate-in fade-in zoom-in duration-300">
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-full object-contain"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          onClick={onClear}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Yükleme Modu
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative w-full h-72 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all flex flex-col items-center justify-center text-center group overflow-hidden"
    >
      {/* KATMAN 1: Görünmez Dosya Inputu (z-10) */}
      <Input
        type="file"
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleFileChange}
      />

      {/* KATMAN 2: Görsel İçerik (z-20) */}
      <div className="flex flex-col items-center justify-center p-4 w-full max-w-sm relative z-20 pointer-events-none">
        <div className="p-4 bg-background rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-200">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Fotoğrafı sürükleyin veya tıklayın
        </p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          PNG, JPG, WEBP
        </p>
        <div className="flex items-center w-full gap-2 mb-4 opacity-50">
          <div className="h-px bg-border flex-1"></div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            VEYA
          </span>
          <div className="h-px bg-border flex-1"></div>
        </div>
      </div>

      {/* KATMAN 3: URL Input (z-30, tıklanabilir) */}
      <div className="flex items-center gap-2 w-full max-w-[80%] relative z-30">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Görsel bağlantısını yapıştırın..."
            className="pl-9 h-9 bg-background/80 backdrop-blur-sm focus:bg-background transition-all text-sm"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-9 px-3 shadow-sm"
          onClick={handleUrlSubmit}
          disabled={!urlInput.trim()}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
