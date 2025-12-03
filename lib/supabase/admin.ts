// lib/supabase/supabase.ts (Veya Service Key'i tanımladığınız dosya)

import { createClient } from "@supabase/supabase-js";

// GİZLİ ANAHTARDIR. SADECE SERVER-SIDE'DA KULLANILMALIDIR!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

// RLS'yi atlayan yüksek yetkili istemci
export const supabaseAdmin = createClient(
  SUPABASE_URL, 
  SERVICE_ROLE_KEY, // <-- GİZLİ SERVICE ROLE KEY BURADA KULLANILIYOR
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);