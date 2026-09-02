import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://siyslrqlhulazxzvdgcv.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_Epuj0BknlJZVWhzETQRVlw_kLEvB65N";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
