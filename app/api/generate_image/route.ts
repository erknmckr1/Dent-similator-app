import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { fal } from "@fal-ai/client";

const SUPABASE_BUCKET_NAME = "DentAI";

// --- Helper Fonksiyonları ---
async function uploadToSupabase(
  fileBuffer: Buffer,
  folder: string,
  mimeType: string
): Promise<string> {
  const filename = `${folder}/${uuidv4()}.${mimeType.split("/")[1] || "png"}`;
  const { data, error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET_NAME)
    .upload(filename, fileBuffer, { contentType: mimeType, upsert: false });
  if (error) {
    throw new Error(`Supabase Yükleme Hatası: ${error.message}`);
  }
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(SUPABASE_BUCKET_NAME)
    .getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

async function uploadExternalImageToSupabase(
  externalUrl: string,
  folder: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  const response = await fetch(externalUrl);
  if (!response.ok) {
    throw new Error(`Harici görsel alınamadı: ${response.statusText}`);
  }
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const filename = `${folder}/${uuidv4()}.jpeg`;
  const { data, error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET_NAME)
    .upload(filename, imageBuffer, { contentType: mimeType, upsert: false });
  if (error) {
    throw new Error(`Sonuç Görseli Yükleme Hatası: ${error.message}`);
  }
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(SUPABASE_BUCKET_NAME)
    .getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // --- 1. FormData İşleme ---
    const formData = await request.formData();
    const patientId = formData.get("patientId");
    const prompt = formData.get("prompt");
    const rawSimulationType = formData.get("simulationType");
    const originalImageFile = formData.get("originalImage") as File | null;

    if (
      !originalImageFile ||
      typeof prompt !== "string" ||
      typeof patientId !== "string" ||
      typeof rawSimulationType !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Gerekli form verileri eksik/hatalı." },
        { status: 400 }
      );
    }
    const simulationType: string = rawSimulationType.toLowerCase();

    // --- 2. Oturum Kontrolü ---
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Yetki yok." },
        { status: 401 }
      );
    }
    const uploadedBy = user.id;

    // --- 3. Görseli Buffer'a Çevir ---
    const originalImageBuffer = Buffer.from(
      await originalImageFile.arrayBuffer()
    );

    // --- 4. Görseli Base64'e Çevir (Fal.ai için) ---
    const base64Image = originalImageBuffer.toString("base64");
    const dataUrl = `data:${originalImageFile.type};base64,${base64Image}`;

    // --- 5. Fal.ai Çalıştırma (Base64 ile) ---
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        image_url: dataUrl, // Base64 data URL
        prompt: prompt,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: "jpeg",
      },
      logs: true, // Loglama için
    });

    const falResultUrl = result.data?.images?.[0]?.url;
    if (!falResultUrl) {
      throw new Error("Fal.ai'den sonuç URL'si alınamadı.");
    }

    // --- 6. Orijinal Görseli Supabase'e Yükle ---
    const originalImageUrl = await uploadToSupabase(
      originalImageBuffer,
      "originals",
      originalImageFile.type
    );

    // --- 7. Clinic ID ve User PK ID Çekme ---
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id, clinic_id")
      .eq("auth_user_id", uploadedBy)
      .single();

    const clinicId = userData?.clinic_id;
    const userPkId = userData?.id; // Users tablosundaki PK ID

    if (!clinicId || !userPkId) {
      throw new Error("Klinik ID veya User ID bulunamadı. DB Kaydı yapılamaz.");
    }

    // --- 8. Fal.ai Görüntüsünü Kalıcı Kaydetme ---
    const finalImageUrl = await uploadExternalImageToSupabase(
      falResultUrl,
      "final-photos",
      "image/jpeg"
    );

    // --- 9. Patient Records Kaydı ---
    const recordTitle = `${simulationType.toUpperCase()} Simülasyonu`;

    const { data: recordData, error: recordError } = await supabaseAdmin
      .from("patient_records")
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        title: recordTitle,
        record_type: "SIMULATION",
        created_by: userPkId, // Auth UUID değil, users.id (PK) kullanıyoruz
      })
      .select()
      .single();

    if (recordError || !recordData) {
      throw new Error(`Record oluşturma hatası: ${recordError?.message}`);
    }
    const recordId = recordData.id;

    // --- 10. Patient Photos Kaydı ---
    const { data: photoData, error: photoError } = await supabaseAdmin
      .from("patient_photos")
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        record_id: recordId,
        uploaded_by: uploadedBy,
        original_url: originalImageUrl,
        type: simulationType,
      })
      .select()
      .single();

    if (photoError || !photoData) {
      throw new Error(
        `Fotoğraf kaydı oluşturma hatası: ${photoError?.message}`
      );
    }

    // --- 11. Simulations Kaydı ---
    const { data: simulationData, error: simulationError } = await supabaseAdmin
      .from("simulations")
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        record_id: recordId,
        photo_id: photoData.id,
        type: simulationType,
        ai_url: finalImageUrl,
        status: "success",
      })
      .select()
      .single();

    if (simulationError || !simulationData) {
      throw new Error(
        `Simülasyon kaydı oluşturma hatası: ${simulationError?.message}`
      );
    }

    // --- 12. Activity Logs ---
    // userPkId zaten yukarıda çekildi, tekrar çekmeye gerek yok
    const { error: logError } = await supabaseAdmin
      .from("activity_logs")
      .insert({
        clinic_id: clinicId,
        user_id: userPkId,
        patient_id: patientId,
        action_type: "CREATE_SIMULATION",
        entity: "SIMULATION",
        entity_id: simulationData.id,
        metadata: {
          simulationType: simulationType,
          cost: 1,
        },
      });

    if (logError) {
      console.error(
        "Aktivite Log kaydı oluşturulurken hata:",
        logError.message
      );
    }

    // --- 13. Başarılı Yanıt ---
    return NextResponse.json(
      {
        success: true,
        resultUrl: finalImageUrl,
        dbRecordId: recordId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API İşlemi Başarısız:", error);

    // Fal.ai hatalarını daha detaylı loglama
    if (error && typeof error === "object" && "body" in error) {
      console.log(error);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          (error as Error).message || "Bilinmeyen bir sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}
