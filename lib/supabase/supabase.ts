import { createClient } from "@supabase/supabase-js";

// NEXT_PUBLIC ön ekli olanlar client'ta da erişilebilir
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase client oluşturuldu
export const supabase = createClient(supabaseUrl, supabaseKey);