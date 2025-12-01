"use client";

import { useState } from "react";
import Sidebar from "./sidebar/Sidebar";
import MobileSidebar from "./sidebar/MobileSidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="h-full relative bg-gray-50/50">
      
      {/* DESKTOP SIDEBAR */}
      {/* Genişlik değişimi burada yönetiliyor */}
      <div className="hidden md:flex h-full flex-col fixed inset-y-0 z-[80]">
        <Sidebar 
            isCollapsed={isCollapsed} 
            toggleCollapse={toggleCollapse} 
        />
      </div>

      {/* MAIN CONTENT */}
      {/* Sidebar küçülünce margin-left (pl) de küçülmeli */}
      <main 
        className={cn(
            "h-full transition-all duration-300 ease-in-out", 
            isCollapsed ? "md:pl-[80px]" : "md:pl-72"
        )}
      >
        {/* MOBIL NAVBAR (Değişiklik yok) */}
        <div className="flex items-center p-4 md:hidden border-b bg-white sticky top-0 z-50">
           <MobileSidebar />
           <span className="ml-4 font-bold text-lg text-gray-800">DentVision</span>
        </div>

        {/* SAYFA İÇERİĞİ */}
        <div className="h-full">
           {children}
        </div>
      </main>
    </div>
  );
}