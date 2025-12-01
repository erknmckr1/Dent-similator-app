"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"; // SheetTitle erişilebilirlik için önemli
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MobileSidebar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hydration hatasını önlemek için
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sayfa değiştiğinde menüyü otomatik kapat
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!isMounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 hover:bg-gray-100 rounded-md transition">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-[#111827] border-r-gray-800 w-72 text-white">
        {/* Screen Reader için başlık zorunluluğu varsa */}
        <div className="sr-only">
            <SheetTitle>Mobil Menü</SheetTitle>
        </div>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}