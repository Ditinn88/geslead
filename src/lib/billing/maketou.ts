// src/lib/billing/maketou.ts
// Achat de crédits via Maketou : le navigateur n'appelle que nos Edge Functions, jamais l'API Maketou (clé secrète).
import { supabase } from '../supabase/client';

export const RETURN_PATH = '/billing/maketou/return';
const CART_STORAGE_KEY = 'geslead_maketou_cart';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CreditPack = { key: string; credits: number; price: number };
export type CreditCatalog = { currency: string; packs: CreditPack[] };

// Réponse d'une Edge Function en erreur : statut HTTP et code ({ code: '...' })
async function errorDetails(error: unknown): Promise<{ status: number | null; code: string | null }> {
  const context = (error as { context?: Response })?.context;
  const status = typeof context?.status === 'number' ? context.status : null;
  try {
    const body = await context?.json();
    return { status, code: typeof body?.code === 'string' ? body.code : null };
  } catch {
    return { status, code: null };
  }
}

export const DEFAULT_CREDIT_CATALOG: CreditCatalog = {
  currency: 'XOF',
  packs: [
    { key: 'pack_1', credits: 15, price: 2000 },
    { key: 'pack_2', credits: 45, price: 3000 },
    { key: 'pack_3', credits: 150, price: 10000 },
  ],
};



export async function fetchCreditPacks(): Promise<CreditCatalog | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('maketou-checkout', { method: 'GET' });
      if (!error && Array.isArray(data?.packs) && data.packs.length) {
        return data as CreditCatalog;
      }
    } catch {}
  }
  return DEFAULT_CREDIT_CATALOG;
}


// Crée le panier puis redirige vers la page de paiement Maketou (pleine page, jamais en iframe)
export async function startCreditCheckout(packKey: string): Promise<{ ok: false; code: string } | { ok: true }> {
  if (!supabase) return { ok: false, code: 'MAKETOU_NOT_CONFIGURED' };
  const { data, error } = await supabase.functions.invoke('maketou-checkout', { body: { packKey } });
  if (error || typeof data?.checkoutUrl !== 'string') {
    return { ok: false, code: (await errorDetails(error)).code || 'MAKETOU_CHECKOUT_FAILED' };
  }
  // Secours si Maketou n'ajoute pas l'id du panier à l'adresse de retour (ne survit pas à un autre onglet)
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, data.cartId);
  } catch {}
  window.location.href = data.checkoutUrl;
  return { ok: true };
}

// Id du panier au retour : celui ajouté par Maketou à l'adresse (format non documenté), sinon celui gardé avant la redirection
export function readReturnCartId(): string | null {
  const fromUrl = window.location.search.match(/[?&]cart_?id=([0-9a-f-]{36})/i)?.[1];
  if (fromUrl && UUID_RE.test(fromUrl)) return fromUrl;
  try {
    const saved = sessionStorage.getItem(CART_STORAGE_KEY);
    return saved && UUID_RE.test(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function clearReturnCartId(): void {
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY);
  } catch {}
}

export type ConfirmAnswer =
  | { status: 'completed' | 'waiting_payment' | 'payment_failed' | 'abandoned' | 'checking'; retryAfterMs?: number }
  | { error: 'not_found' | 'not_configured' | 'not_authenticated' | 'retry' };

// Demande au serveur si le panier est payé (c'est lui qui interroge Maketou)
export async function confirmCreditPayment(cartId: string | null): Promise<ConfirmAnswer> {
  if (!supabase) return { error: 'not_configured' };
  const { data, error } = await supabase.functions.invoke('maketou-confirm', { body: cartId ? { cartId } : {} });
  if (!error && typeof data?.status === 'string') return data as ConfirmAnswer;

  const { status } = await errorDetails(error);
  if (status === 404) return { error: 'not_found' };
  if (status === 503) return { error: 'not_configured' };
  if (status === 401) return { error: 'not_authenticated' };
  return { error: 'retry' }; // 502, réseau : on réessaie plus tard
}

export const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  MAKETOU_NOT_CONFIGURED: "Le paiement n'est pas encore disponible. Réessayez un peu plus tard.",
  TOO_MANY_CHECKOUTS: 'Trop de paiements ouverts. Réessayez dans une heure.',
  EMAIL_REQUIRED: 'Votre compte doit avoir une adresse email pour payer.',
  NOT_AUTHENTICATED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  UNKNOWN_PACK: "Ce pack n'existe plus. Rechargez la page.",
  MAKETOU_CHECKOUT_FAILED: 'Impossible de lancer le paiement. Réessayez.',
};
