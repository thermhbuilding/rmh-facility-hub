import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DATABASE_URL:
      process.env.DATABASE_URL ||
      "postgresql://postgres.siyslrqlhulazxzvdgcv:thermhbuilding2026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    DIRECT_URL:
      process.env.DIRECT_URL ||
      "postgresql://postgres.siyslrqlhulazxzvdgcv:thermhbuilding2026@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
    JWT_SECRET: process.env.JWT_SECRET || "rmh-facility-hub-super-secret-key-2026",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://siyslrqlhulazxzvdgcv.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Epuj0BknlJZVWhzETQRVlw_kLEvB65N",
  },
};

export default nextConfig;
