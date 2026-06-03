import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Used ONLY for Supabase Auth operations:
// signUp, signInWithPassword, signInWithOtp, verifyOtp, getUser (JWT validation)
// All data queries go through postgres.js (db.ts)
export const supabaseAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
