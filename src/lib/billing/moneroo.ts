// src/lib/billing/moneroo.ts
// Achat de crédits via Moneroo : le navigateur n'appelle que nos Edge Functions (jamais Moneroo directement).
import { supabase } from '../supabase/client';

export { formatPrice } from './credits';
export const RETURN_PATH = '/billing/moneroo/return';
const REF_STORAGE_KEY = 'geslead_moneroo_ref';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CreditPack = { key: string; credits: number; price: number };
export type CreditCatalog = { currency: string; packs: CreditPack[] };

// Code d'erreur renvoyé par une Edge Function ({ code: '...' })
async function errorCode(error: unknown): Promise<string | null> {
  try {
    const body = await (error as { context?: Response })?.context?.json();
    return typeof body?.code === 'string' ? body.code : null;
  } catch {
    return null;
  }
}

export async function fetchCreditPacks(): Promise<CreditCatalog | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke('moneroo-checkout', { method: 'GET' });
  if (error || !Array.isArray(data?.packs) || !data.packs.length) return null;
  return data as CreditCatalog;
}

// Crée le paiement puis redirige vers la page Moneroo (pleine page, jamais en iframe)
export async function startCreditCheckout(packKey: string): Promise<{ ok: false; code: string } | { ok: true }> {
  if (!supabase) return { ok: false, code: 'PAYMENT_NOT_CONFIGURED' };
  const { data, error } = await supabase.functions.invoke('moneroo-checkout', { body: { packKey } });
  if (error || typeof data?.checkoutUrl !== 'string') {
    return { ok: false, code: (await errorCode(error)) || 'CHECKOUT_FAILED' };
  }
  try {
    sessionStorage.setItem(REF_STORAGE_KEY, data.paymentId);
  } catch {}
  window.location.href = data.checkoutUrl;
  return { ok: true };
}

// Id de notre paiement au retour de Moneroo (?ref=…), sinon celui gardé avant la redirection
export function readReturnRef(): string | null {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref && UUID_RE.test(ref)) return ref;
  try {
    const saved = sessionStorage.getItem(REF_STORAGE_KEY);
    return saved && UUID_RE.test(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function clearReturnRef(): void {
  try {
    sessionStorage.removeItem(REF_STORAGE_KEY);
  } catch {}
}

// Statut lu dans notre base (mis à jour par le webhook Moneroo)
export async function readPaymentStatus(ref: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('payments').select('status').eq('id', ref).maybeSingle();
  return error || !data ? null : data.status;
}

// Demande au serveur d'interroger Moneroo si le webhook tarde
export async function verifyCreditPayment(ref: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke('moneroo-verify', { body: { ref } });
  return error || typeof data?.status !== 'string' ? null : data.status;
}

export const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_NOT_CONFIGURED: "Le paiement n'est pas encore disponible. Réessayez un peu plus tard.",
  TOO_MANY_CHECKOUTS: 'Trop de paiements ouverts. Réessayez dans une heure.',
  EMAIL_REQUIRED: 'Votre compte doit avoir une adresse email pour payer.',
  NOT_AUTHENTICATED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  UNKNOWN_PACK: "Ce pack n'existe plus. Rechargez la page.",
  CHECKOUT_FAILED: 'Impossible de lancer le paiement. Réessayez.',
};
