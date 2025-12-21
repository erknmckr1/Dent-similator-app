"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  ChevronDown, // Yeni eklendi
} from "lucide-react";
import axios from "axios";

const routes = [
  { label: "Genel Bakış", icon: LayoutDashboard, href: "/dashboard" },
  { label: "AI Studio", icon: Sparkles, href: "/dashboard/studio" },
  { label: "Hastalar", icon: Users, href: "/dashboard/patients" },
  { label: "Dosyalar", icon: FolderOpen, href: "/dashboard/files" },
  { label: "Geçmiş", icon: History, href: "/dashboard/history" },
  {
    label: "Ayarlar",
    icon: Settings,
    href: "/dashboard/settings",
    children: [
      { label: "Profilim", href: "/dashboard/settings/profile" },
      {
        label: "Personel Yönetimi",
        href: "/dashboard/settings/personel-management",
      },
      { label: "Klinik Bilgileri", href: "/dashboard/settings/clinic" },
    ],
  },
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
  // Alt menülerin açık/kapalı durumunu takip eder
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const CREDIT_LIMIT = 100;
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

  const toggleMenu = (label: string) => {
    if (isCollapsed) return; // Sidebar kapalıyken accordion çalışmaz
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      {/* 1. HEADER */}
      <div className="flex items-center p-4 mb-4 h-16">
        <div
          className={cn(
            "flex items-center gap-2 transition-all",
            isCollapsed ? "justify-center w-full" : "justify-between w-full"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 transition-opacity duration-300",
              isCollapsed && "hidden"
            )}
          >
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-sidebar-primary rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground whitespace-nowrap tracking-tight">
              DentVision
            </h1>
          </Link>

          {isCollapsed && (
            <div className="w-8 h-8 flex items-center justify-center bg-sidebar-primary rounded-lg shadow-md">
              <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
          )}

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
      <div className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <TooltipProvider delayDuration={0}>
          {routes.map((route) => {
            const hasChildren = !!route.children;
            const isMenuOpen = openMenus.includes(route.label);
            // Ana linkin veya herhangi bir alt linkin aktif olup olmadığını kontrol eder
            const isParentActive =
              pathname === route.href ||
              route.children?.some((child) => pathname === child.href);

            return (
              <div key={route.href} className="space-y-1">
                {isCollapsed ? (
                  // KAPALI SIDEBAR: Sadece Tooltip ile ana ikonlar
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={route.href}
                        className={cn(
                          "flex items-center justify-center p-3 rounded-lg transition-all duration-200 group",
                          isParentActive
                            ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <route.icon className="w-5 h-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border"
                    >
                      {route.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  // AÇIK SIDEBAR: Accordion yapısı
                  <>
                    <div
                      onClick={() =>
                        hasChildren
                          ? toggleMenu(route.label)
                          : router.push(route.href)
                      }
                      className={cn(
                        "flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer group font-medium",
                        isParentActive
                          ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <route.icon className="w-5 h-5 mr-3 shrink-0" />
                      <span className="text-sm flex-1">{route.label}</span>
                      {hasChildren && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform duration-200 opacity-50",
                            isMenuOpen && "rotate-180"
                          )}
                        />
                      )}
                    </div>

                    {/* ALT MENÜ LİSTESİ */}
                    {hasChildren && isMenuOpen && (
                      <div className="ml-4 pl-4 border-l border-sidebar-border space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                        {route.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "block p-2 text-xs rounded-md transition-colors",
                              pathname === child.href
                                ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </TooltipProvider>
      </div>

      {/* 3. KREDİ WIDGET */}
      {!isCollapsed && (
        <div className="p-3">
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
                <span className="text-sm font-medium text-sidebar-foreground truncate w-32 text-left">
                  Dr. {userName}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {userRole}
                </span>
              </div>
              <LogOut
                onClick={handleLogOut}
                className="w-4 h-4 ml-auto text-muted-foreground hover:text-sidebar-primary transition-colors"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
