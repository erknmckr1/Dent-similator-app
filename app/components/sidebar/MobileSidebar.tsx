"use client";

import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  // pathname değiştiğinde menüyü kapat
  // Bu pattern React'in önerdiği yaklaşım
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 hover:bg-gray-100 rounded-md transition">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 bg-[#111827] border-r-gray-800 w-72 text-white"
      >
        <div className="sr-only">
          <SheetTitle>Mobil Menü</SheetTitle>
        </div>
        <Sidebar 
          isCollapsed={false}
          toggleCollapse={() => {}}
          userName="Kullanıcı"
          userRole="Rol"
        />
      </SheetContent>
    </Sheet>
  );
}