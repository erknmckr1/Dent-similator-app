import * as z from "zod";

// Form verileri için şema (UI katmanı)
export const patientRecordFormSchema = z
  .object({
    recordType: z.enum(["TREATMENT", "PAYMENT", "NOTE"], {
      message: "Lütfen geçerli bir işlem tipi seçiniz",
    }),
    recordDate: z.string().min(1, "Tarih zorunludur"),
    title: z
      .string()
      .min(3, "Başlık en az 3 karakter olmalıdır")
      .max(100, "Başlık çok uzun"),
    description: z.string().max(500, "Notlar 500 karakteri geçemez").optional(),
    price: z.string().optional(), 
    cost: z.string().optional(),  
  })
  .refine(
    (data) => {
      if (data.recordType === "TREATMENT") {
        const priceVal = parseFloat(data.price || "0");
        return priceVal > 0;
      }
      return true;
    },
    {
      message: "Tedavi işlemleri için bir fiyat girmelisiniz",
      path: ["price"],
    }
  );

// API'ye gönderilecek veriler için şema (backend katmanı)
export const patientRecordSchema = z
  .object({
    patientId: z.string().uuid("Geçerli bir hasta seçilmelidir"),
    clinicId: z.string().uuid("Geçerli bir klinik seçilmelidir"),
    recordType: z.enum(["TREATMENT", "PAYMENT", "NOTE"], {
      message: "Lütfen geçerli bir işlem tipi seçiniz",
    }),
    recordDate: z.string().min(1, "Tarih zorunludur"),
    title: z
      .string()
      .min(3, "Başlık en az 3 karakter olmalıdır")
      .max(100, "Başlık çok uzun"),
    description: z.string().max(500, "Notlar 500 karakteri geçemez").nullable(),
    price: z.number().min(0, "Fiyat negatif olamaz").nullable(),
    cost: z.number().min(0, "Maliyet negatif olamaz").nullable(),
  })
  .refine(
    (data) => {
      if (data.recordType === "TREATMENT" && (!data.price || data.price === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Tedavi işlemleri için bir fiyat girmelisiniz",
      path: ["price"],
    }
  );

// TypeScript Tiplerini Otomatik Oluştur
export type PatientRecordFormInput = z.infer<typeof patientRecordFormSchema>;
export type PatientRecordInput = z.infer<typeof patientRecordSchema>;