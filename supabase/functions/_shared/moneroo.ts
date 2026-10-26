// Adaptateur Moneroo (https://docs.moneroo.io) — repris de l'exemple du skill izisaas,
// avec les clés lues dans les secrets des Edge Functions (GESLEAD encaisse pour son propre compte).
// Compatible Deno (Edge Functions) et Node (tests) : WebCrypto, aucune dépendance.
import { readEnv } from './env.ts';

const MONEROO_API_URL = 'https://api.moneroo.io';
const FETCH_TIMEOUT_MS = 15_000;

// ─────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────

// Clé secrète Moneroo (null si absente ou si c'est visiblement une clé Stripe)
export function monerooSecretKey(): string | null {
  const key = readEnv('MONEROO_SECRET_KEY')?.trim();
  if (!key || key.length < 10 || /^(sk_|pk_|whsec_)/.test(key)) return null;
  return key;
}

export function monerooWebhookSecret(): string | null {
  return readEnv('MONEROO_WEBHOOK_SECRET')?.trim() || null;
}

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type InitiatePaymentParams = {
  amount: number; // entier ; XOF/XAF = francs entiers (pas de centimes)
  currency: string;
  description: string;
  returnUrl: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
};

export type InitiatePaymentResult =
  | { ok: true; providerTransactionId: string; checkoutUrl: string }
  | { ok: false; error: string };

export type LivePayment = { status: string; amount?: number; currency?: string };

export type NormalizedEvent = {
  providerTransactionId: string;
  status: 'completed' | 'failed';
  failureReason?: string;
  reportedAmount?: number;
  reportedCurrency?: string;
  paymentId?: string; // metadata.paymentId : notre id de ligne
};

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

// Moneroo exige first_name ET last_name (400 silencieux sinon) : « - » en secours
export function splitName(full: string | undefined, fallbackEmail: string): { first: string; last: string } {
  const v = (full ?? '').trim();
  if (!v) return { first: fallbackEmail.split('@')[0] || 'Client', last: '-' };
  const parts = v.split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(' ') || '-' };
}

// Les valeurs de metadata doivent être des chaînes non vides (422 sinon)
export function cleanMetadata(metadata: InitiatePaymentParams['metadata']): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata ?? {})
      .filter(([, v]) => v !== undefined && v !== null && String(v).length > 0)
      .map(([k, v]) => [k, String(v)]),
  );
}

const monerooFetch = (path: string, init: RequestInit) =>
  fetch(`${MONEROO_API_URL}${path}`, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

const toInt = (v: unknown) =>
  typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number.parseInt(v, 10) : undefined;

const currencyCode = (v: unknown) =>
  typeof v === 'string' ? v : typeof v === 'object' && v !== null ? (v as { code?: string }).code : undefined;

// ─────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────

export async function initiatePayment(params: InitiatePaymentParams, secretKey: string): Promise<InitiatePaymentResult> {
  const { first, last } = splitName(params.customerName, params.customerEmail);
  const body = JSON.stringify({
    amount: params.amount,
    currency: params.currency,
    description: params.description.slice(0, 200),
    return_url: params.returnUrl,
    customer: {
      email: params.customerEmail,
      first_name: first,
      last_name: last,
      ...(params.customerPhone ? { phone: params.customerPhone } : {}),
    },
    metadata: cleanMetadata(params.metadata),
  });

  // Erreur réseau : une seule nouvelle tentative
  let res: Response | null = null;
  let networkError = '';
  for (let attempt = 0; attempt < 2 && !res; attempt++) {
    try {
      res = await monerooFetch('/v1/payments/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
      });
    } catch (err) {
      networkError = (err as Error)?.name ?? 'erreur';
    }
  }
  if (!res) return { ok: false, error: `Moneroo injoignable (${networkError})` };

  let parsed: { data?: { id?: string; checkout_url?: string }; message?: string; errors?: Record<string, unknown> };
  try {
    parsed = await res.json();
  } catch {
    return { ok: false, error: `Moneroo a répondu ${res.status} (réponse non JSON)` };
  }

  // id ET checkout_url obligatoires, même sur un 200
  if (!res.ok || !parsed.data?.id || !parsed.data?.checkout_url) {
    const fields = parsed.errors ? ` [${Object.keys(parsed.errors).join(', ')}]` : '';
    return { ok: false, error: `${parsed.message || `Moneroo a répondu ${res.status}`}${fields}` };
  }
  return { ok: true, providerTransactionId: parsed.data.id, checkoutUrl: parsed.data.checkout_url };
}

// Ré-interrogation du statut réel d'un paiement (null si Moneroo est injoignable ou ne répond pas)
export async function verifyPayment(providerTransactionId: string, secretKey: string): Promise<LivePayment | null> {
  let res: Response;
  try {
    res = await monerooFetch(`/v1/payments/${encodeURIComponent(providerTransactionId)}/verify`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as {
    data?: { status?: string; amount?: number | string; currency?: { code?: string } | string };
  } | null;
  if (!json?.data?.status) return null;
  return {
    status: String(json.data.status).toLowerCase(),
    amount: toInt(json.data.amount),
    currency: currencyCode(json.data.currency),
  };
}

// Test de la clé sans paiement : 401/403 = mauvaise clé, 404 = clé valide
export async function probeKey(secretKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await monerooFetch(`/v1/payments/izi_verify_probe_${Date.now()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
    });
    if (res.status === 401 || res.status === 403) return { ok: false, error: 'Clé API Moneroo invalide' };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Moneroo injoignable (${(err as Error)?.name ?? 'erreur'})` };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Webhooks
// ─────────────────────────────────────────────────────────────────────────

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

// Comparaison en temps constant
export function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

// X-Moneroo-Signature = hex(HMAC_SHA256(corps brut, secret du webhook)) — sur les octets reçus, jamais re-sérialisés
export async function verifyMonerooSignature(rawBody: Uint8Array, signature: string | null, secret: string) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = toHex(await crypto.subtle.sign('HMAC', key, rawBody));
  return safeEqual(signature.trim().toLowerCase(), expected);
}

// Moneroo ne fournit pas d'identifiant d'événement stable : empreinte du corps brut
export async function computeEventId(rawBody: Uint8Array): Promise<string> {
  return `synthetic-${toHex(await crypto.subtle.digest('SHA-256', rawBody)).slice(0, 32)}`;
}

export function parseMonerooEvent(body: unknown): NormalizedEvent | null {
  const b = body as { event?: string; data?: Record<string, unknown> } | null;
  if (!b?.event || !b.data) return null;
  const data = b.data;
  const id = typeof data.id === 'string' ? data.id : undefined;
  if (!id) return null;

  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const common = {
    providerTransactionId: id,
    reportedAmount: toInt(data.amount),
    reportedCurrency: currencyCode(data.currency),
    paymentId: typeof metadata.paymentId === 'string' ? metadata.paymentId : undefined,
  };

  if (b.event === 'payment.success') return { ...common, status: 'completed' };
  if (b.event === 'payment.failed' || b.event === 'payment.cancelled') {
    return { ...common, status: 'failed', failureReason: typeof data.status === 'string' ? data.status : b.event };
  }
  // payment.initiated : informatif, la ligne est déjà « pending »
  return null;
}
