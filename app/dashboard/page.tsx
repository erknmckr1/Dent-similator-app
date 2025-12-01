"use client";

import React from "react";
import CfoWidgets from "../components/overview/CfoWidgets";
import {
  Users,
  CalendarDays,
  Activity,
  UserPlus,
  Clock,
  MoreHorizontal,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


// --- MOCK DATA ---

// Grafik: Hasta Ziyaretleri vs Yeni Kayıtlar
const clinicTrafficData = [
  { name: "Pzt", ziyaret: 12, yeni: 4 },
  { name: "Sal", ziyaret: 18, yeni: 6 },
  { name: "Çar", ziyaret: 15, yeni: 3 },
  { name: "Per", ziyaret: 22, yeni: 8 },
  { name: "Cum", ziyaret: 20, yeni: 5 },
  { name: "Cmt", ziyaret: 25, yeni: 9 }, // Haftasonu yoğunluğu
  { name: "Paz", ziyaret: 5, yeni: 1 },
];

// Bugünkü Randevular
const todaysAppointments = [
  {
    id: 1,
    time: "09:30",
    patient: "Ali Vural",
    type: "İlk Muayene",
    status: "completed",
  },
  {
    id: 2,
    time: "10:15",
    patient: "Zeynep Tekin",
    type: "Diş Beyazlatma",
    status: "in-progress",
  },
  {
    id: 3,
    time: "11:00",
    patient: "Burak Yılmaz",
    type: "Kontrol",
    status: "pending",
  },
  {
    id: 4,
    time: "13:30",
    patient: "Ayşe Demir",
    type: "Veneer Prova",
    status: "pending",
  },
  {
    id: 5,
    time: "15:00",
    patient: "Mehmet Öz",
    type: "Dolgu",
    status: "pending",
  },
];

// Son Eklenen Hastalar
const recentPatients = [
  { id: 1, name: "Selin Kaya", date: "Bugün, 09:00", source: "Instagram" },
  { id: 2, name: "Murat Can", date: "Dün, 16:45", source: "Referans" },
  { id: 3, name: "Elif Su", date: "Dün, 14:20", source: "Google" },
];

export default function GeneralOverviewPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4">
      {/* 1. HEADER: Hoşgeldin Mesajı ve Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Dr. Ahmet, Günaydın! 👋
          </h2>
          <p className="text-muted-foreground">
            Bugün 5 randevunuz var, kliniğiniz %85 doluluk oranında.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex bg-white">
            <CalendarDays className="mr-2 h-4 w-4" />
            Takvimi Aç
          </Button>
          <Button className="bg-gray-900 text-white hover:bg-gray-800">
            <UserPlus className="mr-2 h-4 w-4" />
            Yeni Hasta Ekle
          </Button>
        </div>
      </div>

      {/* 2. KPI KARTLARI (Klinik Geneli) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Hasta"
          value="1,248"
          icon={Users}
          trend="+12 bu hafta"
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Bugünkü Randevular"
          value="5"
          icon={CalendarDays}
          trend="2 tanesi yeni"
          color="bg-violet-500/10 text-violet-600"
        />
        <StatCard
          title="Aktif Tedaviler"
          value="24"
          icon={Activity}
          trend="Devam eden süreçler"
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Bekleyen İşler"
          value="3"
          icon={Clock}
          trend="Arama & Simülasyon"
          color="bg-orange-500/10 text-orange-600"
        />
      </div>

      {/* 3. ORTA BÖLÜM: Grafik ve Ajanda */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* SOL: Klinik Trafiği (Chart) - Geniş Alan */}
        <Card className="col-span-1 md:col-span-4 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Haftalık Klinik Trafiği</CardTitle>
            <CardDescription>
              Ziyaret eden hastalar ve yeni kayıtların karşılaştırması.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clinicTrafficData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  {/* Ziyaretler */}
                  <Bar
                    name="Toplam Ziyaret"
                    dataKey="ziyaret"
                    fill="#f3f4f6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  {/* Yeni Kayıtlar (Bizim için önemli olan bu) */}
                  <Bar
                    name="Yeni Hasta"
                    dataKey="yeni"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* SAĞ: Günlük Ajanda (List) - Dar Alan */}
        <Card className="col-span-1 md:col-span-3 shadow-sm border-gray-200 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bugünün Ajandası</CardTitle>
              <Badge variant="outline" className="text-gray-500 font-normal">
                26 Kasım
              </Badge>
            </div>
            <CardDescription>Yaklaşan randevularınız.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-6">
              {todaysAppointments.map((apt, index) => (
                <div key={apt.id} className="flex gap-4 group">
                  {/* Sol: Saat Çizgisi */}
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-700 font-mono">
                      {apt.time}
                    </span>
                    {index !== todaysAppointments.length - 1 && (
                      <div className="w-px h-full bg-gray-200 my-2 group-hover:bg-violet-200 transition-colors"></div>
                    )}
                  </div>

                  {/* Sağ: Kart */}
                  <div className="flex-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {apt.patient}
                      </h4>
                      {apt.status === "completed" && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {apt.status === "in-progress" && (
                        <Badge className="bg-blue-500 h-5 px-1.5 text-[10px]">
                          İçeride
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{apt.type}</p>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2 bg-white border"
                      >
                        Detay
                      </Button>
                      {/* Sadece AI gerektiren durumlarda bu buton çıkabilir */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2 bg-white border text-violet-600"
                      >
                        AI Analiz
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. ALT BÖLÜM: Son Kayıtlar ve Hızlı Erişim */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Son Eklenen Hastalar */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Son Eklenen Hastalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 bg-gray-100 border">
                      <AvatarFallback className="text-gray-600 font-medium">
                        {p.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.source}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{p.date}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 text-sm text-gray-500 h-9"
            >
              Tümünü Gör
            </Button>
          </CardContent>
        </Card>

        {/* Hızlı Aksiyonlar (AI Studio Promo) */}
        <div className="bg-linear-to-br from-violet-600 to-indigo-700 rounded-xl p-6 text-white flex flex-col justify-between shadow-lg shadow-violet-200">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-200" />
              AI Studio ya Git
            </h3>
            <p className="text-violet-100 text-sm mb-6 max-w-sm">
              Bugün gelen hastalardan <strong>2 tanesi</strong> estetik gülüş
              tasarımı için uygun görünüyor. Simülasyon yaparak tedavi kabul
              oranını artırabilirsin.
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-white text-violet-700 hover:bg-gray-100 border-0 font-semibold">
              Simülasyon Başlat
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/10"
            >
              Öğretici İzle
            </Button>
          </div>
        </div>
      </div>
      {/* 5. CFO */}
      <CfoWidgets/>
    </div>
  );
}

// --- YARDIMCI BİLEŞEN: STAT CARD ---
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  trend: string;
  color: string;
}) {
  return (
    <Card className="shadow-sm border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            {trend}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
