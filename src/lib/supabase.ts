import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ ERROR: Variables de entorno de Supabase no detectadas. " +
    "Verifica tu archivo .env.local"
  );
}

export const supabase = createBrowserClient(
  supabaseUrl!,
  supabaseAnonKey!
);
