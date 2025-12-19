"use client";

import React, { useMemo, useState,useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import { useRef } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import trLocale from "@fullcalendar/core/locales/tr";
import timeGridPlugin from "@fullcalendar/timegrid";
import { cn } from "@/lib/utils";

type CalendarPickerProps = {
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  onEventClick?: (event: any) => void;
  records: PatientRecord[];
};

type PatientRecord = {
  id: string;
  record_date: string;
  title: string;
  record_type: string;
  price: number | null;
  description?: string | null;
  cost?: number | null;
  patient_id: string;
  patients?: {
    name: string;
  };
};

export default function CalendarPicker({
  selectedDate,
  onSelectDate,
  onEventClick,
  records,
}: CalendarPickerProps) {
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const calendarRef = useRef<any>(null); // Takvim referansı

  const recordsByDate = useMemo(() => {
    return records.reduce((acc, r) => {
      const date = r.record_date?.split("T")[0];
      if (!date) return acc;
      if (!acc[date]) acc[date] = [];
      acc[date].push(r);
      return acc;
    }, {} as Record<string, PatientRecord[]>);
  }, [records]);

  const calendarEvents = useMemo(() => {
    return records
      .filter((r) => r.record_date)
      .map((r) => {
        const fixedStart = r.record_date.replace("Z", "").split("+")[0];

        const startDate = new Date(fixedStart);
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

        const fixedEnd = endDate.toLocaleString("sv-SE").replace(" ", "T");

        return {
          id: r.id,
          title: `${r.patients?.name || "Bilinmiyor"} - ${r.title}`,
          start: fixedStart,
          end: fixedEnd,
          extendedProps: {
            type: r.record_type,
            price: r.price,
            patientName: r.patients?.name || "Bilinmiyor",
            description: r.description,
            cost: r.cost,
            patientId: r.patient_id,
          },
        };
      });
  }, [records]);

useEffect(() => {
  const timeoutId = setTimeout(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.unselect(); // seçili alanı temizler
    }
    setActiveEventId(null);
  }, 0);

  return () => clearTimeout(timeoutId); // Cleanup: bileşen kapanırsa işlemi iptal et
}, [records]);

  return (
    <div className="calendar-container rounded-xl relative z-50 flex flex-col border overflow-hidden border-border bg-card shadow-sm p-4">
      {/* İnce ayar CSS: Eventlerin yüksekliğini kısıtlar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .fc-v-event { 
          min-height: 22px !important; 
          max-height: 25px !important; 
          margin-bottom: 1px !important;
        }
        .fc-timegrid-event-harness { margin-bottom: 2px !important; }
      `,
        }}
      />

      {
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
          initialView="timeGridWeek" // Genelde hafta görünümü daha kullanışlıdır
          locale={trLocale}
          height="700px"
          events={calendarEvents}
          selectable={true}
          selectMirror={true}
          timeZone="local"
          unselectAuto={false}
          slotEventOverlap={false} // Eventlerin üst üste binip boş slotu kapatmasını engeller
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          eventClick={(info) => {
            const api = calendarRef.current.getApi();
            const clickedId = info.event.id;
            if (activeEventId === clickedId) {
              // AYNI EVENTE 2. TIKLAYIŞ: KAPAT VE SIFIRLA
              setActiveEventId(null);
              onEventClick?.(null); // Parent'a null göndererek formu temizliyoruz
            } else {
              // YENİ VEYA FARKLI EVENTE TIKLAYIŞ: AKTİF ET
              setActiveEventId(clickedId);
              api.unselect(); // Varsa mavi slot seçimini kaldır
              onEventClick?.(info.event);
            }
          }}
          select={(info) => {
            if (activeEventId) {
              // EĞER BİR EVENT SEÇİLİYKEN BOŞ SAATE TIKLANIRSA: SAATİ TAŞI
              onSelectDate?.(info.startStr);
              // Not: activeEventId'yi sıfırlamıyoruz çünkü kullanıcı
              // "Buraya taşıdım ama vazgeçtim şuraya taşıyayım" diyebilir.
            } else {
              // NORMAL YENİ KAYIT SEÇİMİ
              onSelectDate?.(info.startStr);
            }
          }}
          // eventClassNames kısmına "Aktiflik" görseli ekle (Mavi parlaması için)
          eventClassNames={(info) => {
            const isActive = info.event.id === activeEventId;
            const isPast = info.event.start && info.event.start < new Date();

            return cn(
              "rounded-sm shadow-sm transition-all duration-200 cursor-pointer",
              isActive
                ? "!bg-blue-500  z-50   border-white"
                : isPast
                ? "!bg-red-600 !text-white"
                : "!bg-primary !border-none text-white"
            );
          }}
          selectAllow={(selectInfo) => {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            if (selectInfo.start < todayStart) return false;

            return !records.some((r) => {
              if (!r.record_date) return false;
              const eventStart = new Date(r.record_date);
              const eventEnd = new Date(eventStart.getTime() + 30 * 60 * 1000);
              return selectInfo.start < eventEnd && selectInfo.end > eventStart;
            });
          }}
          // EVENT GÖRÜNÜMÜ (TEK SATIR VE HOVER)
          eventContent={(eventInfo) => {
            const { timeText, event } = eventInfo;
            const { type, price, patientName } = event.extendedProps;

            // Hover edildiğinde görünecek detaylı metin
            const detail = `${timeText} | ${patientName} | ${
              event.title
            } (${type}) ${price ? `- ${price}₺` : ""}`;

            return (
              <div
                title={detail}
                className="flex flex-col justify-center px-1 text-[10px] leading-tight truncate w-full h-full text-white"
              >
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="font-bold shrink-0 opacity-85">
                    {timeText}
                  </span>
                  <span className="font-extrabold truncate uppercase border-l border-white/30 pl-1">
                    {patientName}
                  </span>
                </div>
                <div className="truncate opacity-90 italic">
                  {event.title.split(" - ")[1] || event.title}
                </div>
              </div>
            );
          }}
          allDaySlot={false}
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotMinTime="00:00:00"
          slotMaxTime="23:59:00"
          dayCellClassNames={(arg) => {
            const dateStr = arg.date.toLocaleDateString("en-CA");
            const isSelected = selectedDate?.startsWith(dateStr);
            const isPast = arg.date < new Date(new Date().setHours(0, 0, 0, 0));
            return cn(
              "cursor-pointer transition-colors",
              isSelected && "!bg-primary/10",
              isPast && "bg-muted opacity-60"
            );
          }}
          // Ay görünümündeki küçük rozetler
          dayCellDidMount={(arg) => {
            const dateStr = arg.date.toLocaleDateString("en-CA");
            const dayRecords = recordsByDate[dateStr];
            if (!dayRecords || dayRecords.length === 0) return;

            const frame = arg.el.querySelector(
              ".fc-daygrid-day-frame"
            ) as HTMLElement;
            if (frame) {
              frame.style.position = "relative";
              const badge = document.createElement("div");
              badge.innerText = String(dayRecords.length);
              badge.className =
                "absolute bottom-1 z-50 right-1 w-5 h-5 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold shadow-sm";
              frame.appendChild(badge);
            }
          }}
        />
      }
    </div>
  );
}
