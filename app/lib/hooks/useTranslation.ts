"use client";

import { useParams } from "next/navigation";
import en from "@/locales/en.json";
import tr from "@/locales/tr.json";
import ru from "@/locales/ru.json";
import ar from "@/locales/ar.json";
import es from "@/locales/es.json";
import ko from "@/locales/ko.json";
import de from "@/locales/de.json";

// JSON türlerini temsil eden tipler
type TranslationValue =
  | string
  | TranslationObject
  | TranslationArray
  | number
  | boolean;
type TranslationObject = { [key: string]: TranslationValue };
type TranslationArray = Array<TranslationValue>;

export function useTranslation() {
  //  URL'deki locale parametresini al
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  //  Locale'leri eşleştir
  const locales: Record<string, TranslationObject> = {
    en,
    tr,
    ru,
    ar,
    es,
    ko,
    de,
  };

  //  Eğer belirtilen locale yoksa fallback olarak İngilizceyi kullan
  const translations = locales[locale] || locales.en;

//  Ana çeviri fonksiyonu (placeholder destekli)
const t = <T = string>(path: string, vars?: Record<string, any>): T => {
  const result = path
    .split(".")
    .reduce<TranslationValue | undefined>((acc, key) => {
      if (acc && typeof acc === "object" && !Array.isArray(acc)) {
        return (acc as TranslationObject)[key];
      }
      return undefined;
    }, translations as TranslationValue);

  let value = (result ?? path) as string;

  //  Vars parametresi varsa, string içinde replace et
  if (typeof value === "string" && vars) {
    Object.entries(vars).forEach(([key, val]) => {
      value = value.replace(new RegExp(`{${key}}`, "g"), String(val));
    });
  }

  return value as T;
};


  //  Geri dönen değerler
  return { t, locale };
}
