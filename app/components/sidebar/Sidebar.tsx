"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  FolderOpen,
  Settings,
  CreditCard,
  LogOut,
  History,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import axios from "axios";

// Renkleri "hardcoded" vermektense, aktif durumda tema rengini kullanacağız.
// Buradaki color tanımlarını kaldırdık veya sadeleştirebiliriz.
const routes = [
  { label: "Genel Bakış", icon: LayoutDashboard, href: "/dashboard" },
  { label: "AI Studio", icon: Sparkles, href: "/dashboard/studio" },
  { label: "Hastalar", icon: Users, href: "/dashboard/patients" },
  { label: "Dosyalar", icon: FolderOpen, href: "/dashboard/folders" },
  { label: "Geçmiş", icon: History, href: "/dashboard/history" },
  { label: "Ayarlar", icon: Settings, href: "/dashboard/settings" },
];

interface SidebarProps {
  creditCount?: number;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  className?: string;
  userName: string;
  userRole: string;
}

export default function Sidebar({
  isCollapsed,
  toggleCollapse,
  className,
  userName,
  userRole,
  creditCount,
}: SidebarProps) {
  const pathname = usePathname();
  const CREDIT_LIMIT = 50;
  const router = useRouter();
  const handleLogOut = async () => {
    try {
      const response = await axios.post("/api/auth/logout");
      if (response.status === 200) {
        alert("Oturum başarıyla sonlandırıldı.");
        router.push("/auth/login");
      }
    } catch (err) {
      console.log(err);
      alert("Oturum kapatma işlemi başarısız.");
    }
  };
  return (
    <div
      className={cn(
        "relative flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      {/* 1. HEADER & TOGGLE BUTONU */}
      <div className="flex items-center p-4 mb-4 h-16">
        <div
          className={cn(
            "flex items-center gap-2 transition-all",
            isCollapsed ? "justify-center w-full" : "justify-between w-full"
          )}
        >
          {/* Logo Alanı */}
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 transition-opacity duration-300",
              isCollapsed && "hidden"
            )}
          >
            <div className="relative w-8 h-8">
              {/* LOGO ZEMİNİ: bg-sidebar-primary (Bronz) */}
              <div className="absolute inset-0 bg-sidebar-primary rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
            </div>
            {/* LOGO YAZISI: Ana tema rengi */}
            <h1 className="text-xl font-bold text-sidebar-foreground whitespace-nowrap tracking-tight">
              DentVision
            </h1>
          </Link>

          {/* Eğer collapsed ise sadece logo ikonunu göster */}
          {isCollapsed && (
            <div className="w-8 h-8 flex items-center justify-center bg-sidebar-primary rounded-lg shadow-md">
              <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
          )}

          {/* Küçültme/Büyütme Butonu */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "text-muted-foreground hover:text-sidebar-foreground transition p-1 rounded-md hover:bg-sidebar-accent",
              isCollapsed
                ? "absolute -right-3 top-6 bg-sidebar border border-sidebar-border rounded-full shadow-md z-50 text-sidebar-foreground"
                : "ml-auto"
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. MENU LINKLERİ */}
      <div className="flex-1 px-3 space-y-2">
        <TooltipProvider delayDuration={0}>
          {routes.map((route) => {
            const isActive = pathname === route.href;

            // Link İçeriği
            const LinkContent = (
              <div
                className={cn(
                  "flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer group font-medium",
                  // AKTİF DURUM: Zemin Accent (Koyu Gri), İkon Primary (Bronz)
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                  isCollapsed && "justify-center"
                )}
              >
                <route.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    !isCollapsed && "mr-3"
                  )}
                />
                {!isCollapsed && <span className="text-sm">{route.label}</span>}
              </div>
            );

            return (
              <div key={route.href}>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={route.href}>{LinkContent}</Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border font-medium"
                    >
                      {route.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link href={route.href}>{LinkContent}</Link>
                )}
              </div>
            );
          })}
        </TooltipProvider>
      </div>

      {/* 3. KREDİ WIDGET */}
      {!isCollapsed && (
        <div className="p-3 animate-in fade-in duration-500">
          {/* WIDGET ZEMİNİ: bg-sidebar-accent (Sidebar renginin bir ton açığı) */}
          <div className="bg-sidebar-accent rounded-xl p-4 border border-sidebar-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-sidebar-primary" />
              <h3 className="text-sm font-semibold text-sidebar-foreground">
                Paket Durumu
              </h3>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Kalan</span>
                <span className="text-sidebar-foreground font-medium">
                  {creditCount}/{CREDIT_LIMIT}
                </span>
              </div>
              {/* PROGRESS BAR: Gösterge otomatik olarak 'primary' rengini (Bronz) alır */}
              <Progress
                value={((creditCount || 0) / CREDIT_LIMIT) * 100}
                className="h-2 bg-sidebar-border"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. USER PROFILE */}
      <div className="p-3 mt-auto border-t border-sidebar-border">
        <button
          className={cn(
            "flex items-center w-full rounded-lg hover:bg-sidebar-accent transition p-2 group",
            isCollapsed ? "justify-center" : "gap-x-3"
          )}
        >
          <div className="w-9 h-9 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sm font-bold text-sidebar-foreground shrink-0 group-hover:border-sidebar-primary/50 transition-colors">
            DR
          </div>
          {!isCollapsed && (
            <>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-medium group-hover:text-sidebar-accent-foreground text-sidebar-foreground truncate w-32 text-left">
                  Dr. {userName} - {userRole}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Premium
                </span>
              </div>{" "}
              <LogOut
                onClick={handleLogOut}
                className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-sidebar-primary transition-colors"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}