import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Vite environment variables or Next.js compatibility
const supabaseUrl =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  'https://mlshntuonyoylpilivay.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  'sb_publishable_E2r3zzFV0cfaAAt81l0b_A_o2DhgRkU';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Checks connection status with Supabase project.
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  projectUrl: string;
  user?: any;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Variables Supabase manquantes dans le fichier .env.',
      projectUrl: supabaseUrl,
    };
  }

  try {
    // Ping Supabase Auth settings to verify key validity
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
      },
    });

    if (res.ok) {
      const { data } = await supabase.auth.getSession();
      return {
        connected: true,
        message: 'Connecté avec succès au projet Supabase (mlshntuonyoylpilivay) !',
        projectUrl: supabaseUrl,
        user: data.session?.user ?? null,
      };
    } else {
      return {
        connected: false,
        message: `Erreur HTTP ${res.status} lors de la validation des identifiants Supabase.`,
        projectUrl: supabaseUrl,
      };
    }
  } catch (err) {
    return {
      connected: false,
      message: `Impossible de joindre le serveur Supabase : ${(err as Error).message}`,
      projectUrl: supabaseUrl,
    };
  }
}
