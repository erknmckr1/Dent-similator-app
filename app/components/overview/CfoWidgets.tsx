"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- MOCK DATA ---

// 1. DÖNÜŞÜM HUNİSİ VERİSİ
const funnelData = [
  { name: "Simülasyon", value: 100, fill: "#94a3b8" }, // Gri (Başlangıç)
  { name: "Teklif", value: 85, fill: "#60a5fa" },     // Mavi
  { name: "Onay", value: 55, fill: "#8b5cf6" },       // Mor (Bizim Rengimiz)
  { name: "Tedavi", value: 45, fill: "#10b981" },     // Yeşil (Para)
];

// 2. GELİR VERİSİ (Potansiyel vs Gerçekleşen)
const revenueData = [
  { name: "Pzt", potansiyel: 45000, gerceklesen: 24000 },
  { name: "Sal", potansiyel: 32000, gerceklesen: 28000 },
  { name: "Çar", potansiyel: 50000, gerceklesen: 15000 }, // Çok teklif verilmiş ama dönüşmemiş
  { name: "Per", potansiyel: 28000, gerceklesen: 22000 },
  { name: "Cum", potansiyel: 60000, gerceklesen: 45000 },
];

// 3. RANDEVU DURUMU (Pie Chart)
const appointmentStatusData = [
  { name: "Tamamlandı", value: 65, color: "#10b981" },
  { name: "İptal", value: 15, color: "#ef4444" },
  { name: "Gelmedi (No-Show)", value: 10, color: "#f59e0b" },
  { name: "Ertelendi", value: 10, color: "#6366f1" },
];

export default function CfoWidgets() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
      
      {/* 1. AI DÖNÜŞÜM ANALİZİ (Geniş Alan) */}
      <Card className="col-span-1 lg:col-span-4 shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>Simülasyon Dönüşüm Başarısı</CardTitle>
          <CardDescription>
            AI simülasyonu yapılan 100 hastadan 45 i tedaviye başladı. (%45 Başarı)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical" // Yatay huni görünümü için
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{fontSize: 12, fontWeight: 500}}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                    {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. RANDEVU SADAKATİ (Pie Chart - Dar Alan) */}
      <Card className="col-span-1 lg:col-span-3 shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>Randevu Sonuçları</CardTitle>
          <CardDescription>Bu ayın randevu gerçekleşme oranları.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={appointmentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {appointmentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
             </ResponsiveContainer>
             {/* Ortadaki İptal Oranı */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                <span className="text-3xl font-bold text-gray-900">%15</span>
                <p className="text-xs text-red-500 font-medium">İptal Oranı</p>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. FİNANSAL TABLO (Tab'lı Yapı - Alt Bölüm) */}
      <Card className="col-span-1 lg:col-span-7 shadow-sm border-gray-200">
         <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Finansal Performans</CardTitle>
                    <CardDescription>Potansiyel teklifler ve kasaya giren net tutarlar.</CardDescription>
                </div>
                {/* Opsiyonel: Tab Değiştirici */}
                <Tabs defaultValue="revenue" className="w-[200px]">
                    <TabsList>
                        <TabsTrigger value="revenue">Gelir</TabsTrigger>
                        <TabsTrigger value="treatments">İşlemler</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
         </CardHeader>
         <CardContent>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis 
                            stroke="#888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => `₺${value / 1000}k`} 
                        />
                        <Tooltip 
                            formatter={(value) => `₺${value}`}
                            contentStyle={{ borderRadius: '8px' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar name="Potansiyel (Teklif)" dataKey="potansiyel" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar name="Gerçekleşen (Kasa)" dataKey="gerceklesen" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </CardContent>
      </Card>

    </div>
  );
}