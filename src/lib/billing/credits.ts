// src/lib/billing/credits.ts
import { supabase } from '../supabase/client';

export const WELCOME_CREDITS = 5;
// Affichage uniquement : le débit réel est fait par la fonction SQL spend_search_credits() (3 crédits)
export const SEARCH_CREDIT_COST = 3;

export function formatPrice(amount: number, currency: string = 'GNF'): string {
  const value = new Intl.NumberFormat('fr-FR').format(amount);
  if (currency === 'GNF') return `${value} GNF`;
  return currency === 'XOF' || currency === 'XAF' ? `${value} FCFA` : `${value} ${currency}`;
}

// Vrai compte Supabase (le compte démo n'a pas d'id) : crédits gérés par la base
export function hasRealAccount(user: { id?: string } | null): boolean {
  return Boolean(supabase && user?.id);
}

export async function fetchCredits(userId: string): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('credits').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return data.credits;
}

export type SpendResult =
  | { ok: true; balance: number }
  | { ok: false; reason: 'INSUFFICIENT_CREDITS' | 'ERROR'; message?: string };

// Débit atomique de 3 crédits, côté serveur
export async function spendSearchCredits(): Promise<SpendResult> {
  if (!supabase) return { ok: false, reason: 'ERROR', message: 'Supabase non configuré' };
  const { data, error } = await supabase.rpc('spend_search_credits');
  if (error) {
    return {
      ok: false,
      reason: error.message?.includes('INSUFFICIENT_CREDITS') ? 'INSUFFICIENT_CREDITS' : 'ERROR',
      message: error.message,
    };
  }
  return { ok: true, balance: data as number };
}
