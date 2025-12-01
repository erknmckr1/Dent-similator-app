import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { fal } from "@fal-ai/client";

const SUPABASE_BUCKET_NAME = "DentAI";

/**
 * 1. Base64 Data URL'sini Buffer'a çevirir.
 */
function dataURLtoBuffer(dataurl: string): {
  buffer: Buffer;
  mimeType: string;
} {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid Data URL format.");

  const mimeType = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return { buffer: Buffer.from(u8arr), mimeType };
}

/**
 * Buffer'ı Supabase Storage'a yükler ve kalıcı public URL'sini döndürür.
 * Node.js ortamında Buffer'ı alıp, Supabase API'sine doğru formatta gönderir.
 */
async function uploadToSupabase(
  fileBuffer: Buffer,
  folder: string,
  mimeType: string
): Promise<string> {
  // 1. Hedef dosya yolunu (path) oluşturma
  // Bu, Supabase'te dosyanın nerede görüneceğini belirler (örn: originals/23e23-23e3.png)
  const filename = `${folder}/${uuidv4()}.${mimeType.split("/")[1] || "png"}`;

  // 2. Yükleme İşlemi
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET_NAME) // Hangi "bucket" içine yüklenecek?
    .upload(filename, fileBuffer, {
      // Buffer'ı gönderiyoruz
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Yükleme Hatası: ${error.message}`);
  }

  // 3. Public URL'yi Alma
  // Dosya yüklendikten sonra, ona dışarıdan erişilebilecek URL'yi almalıyız
  const { data: publicUrlData } = supabase.storage
    .from(SUPABASE_BUCKET_NAME)
    .getPublicUrl(data.path);

  // Fal.ai'ye gidecek kalıcı URL budur!
  return publicUrlData.publicUrl;
}

export async function POST(request: Request) {
  try {
    // --- 1. Gelen FormData'yı İşleme ---
    const formData = await request.formData();

    const originalImageFile = formData.get("originalImage") as File | null;
    const prompt = formData.get("prompt") as string;
    const simulationType = formData.get("simulationType") as string;

    if (!originalImageFile || !prompt) {
      return NextResponse.json(
        { success: false, error: "Gerekli görsel veya prompt eksik." },
        { status: 400 }
      );
    }

    // file objesini buffer a çevir
    const originalImageBuffer = Buffer.from(
      await originalImageFile.arrayBuffer()
    );

    // 1. Supabase Yüklemesini yap ve kalıcı URL'yi al
    const originalImageUrl = await uploadToSupabase(
      originalImageBuffer,
      "originals", // Klasör adı
      originalImageFile.type // Dosya tipi
    );

    console.log(originalImageUrl);

    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        prompt,
        image_url: originalImageUrl,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    

    if (!originalImageFile) {
      return NextResponse.json(
        { success: false, error: "Dosya Yüklenemedi." },
        { status: 400 }
      );
    }

    // --- 2. Başarılı Test Yanıtı ---

    return NextResponse.json({
      success: true,
      resultUrl: result.data?.images?.[0].url,
      dbRecordId: "mock-db-id",
    });
  } catch (error) {
    console.error("API İşlemi Başarısız:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Endpoint'e ulaşıldı ancak işleme hatası.",
      },
      { status: 500 }
    );
  }
}
