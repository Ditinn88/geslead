// Client HTTP Maketou (https://docs-api.maketou.com) : deux endpoints, création d'un panier et lecture de son statut.
// Maketou n'envoie aucun webhook et le panier ne contient jamais le montant payé.
// Compatible Deno (Edge Functions) et Node (tests) : fetch natif, aucune dépendance.
import { readEnv } from './env.ts';

export const CART_STATUSES = ['waiting_payment', 'completed', 'abandoned', 'payment_failed'] as const;
export type CartStatus = (typeof CART_STATUSES)[number];
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MaketouError extends Error {
  code: string;
  httpStatus: number | null;
  retryAfterSec: number | null;
  fields: string[]; // champs refusés par une validation 422 (noms seulement, jamais les valeurs)

  constructor(code: string, message: string, httpStatus: number | null = null, retryAfterSec: number | null = null, fields: string[] = []) {
    super(message);
    this.name = 'MaketouError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.retryAfterSec = retryAfterSec;
    this.fields = fields;
  }
}

// Panne (Maketou injoignable ou réponse illisible) : jamais une raison de clore un paiement
export const isOutage = (code: string) =>
  code === 'NETWORK_ERROR' || code === 'MALFORMED_RESPONSE' || code === 'INVALID_RESPONSE' || /^HTTP_5\d\d$/.test(code);
export const isConfigError = (code: string) => code === 'INVALID_API_KEY' || code === 'MAKETOU_NOT_CONFIGURED';

// ─────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────

// Le problème cite la variable, jamais sa valeur
export function maketouApiKeyProblem(): string | null {
  const key = readEnv('MAKETOU_API_KEY')?.trim();
  if (!key) return 'MAKETOU_API_KEY manquante';
  if (!/^[\x21-\x7E]+$/.test(key) || /["'`#]/.test(key)) {
    return 'MAKETOU_API_KEY mal formée (espace, guillemet ou commentaire collé à la valeur)';
  }
  return null;
}

const baseUrl = () => (readEnv('MAKETOU_API_URL')?.trim() || 'https://api.maketou.net').replace(/\/+$/, '');

// ─────────────────────────────────────────────────────────────────────────
// Appel HTTP : toute exception devient une MaketouError, classée d'abord par statut HTTP
// ─────────────────────────────────────────────────────────────────────────

const redact = (t: string) => t.replace(/\S+@\S+/g, '[email]').replace(/\+?\d[\d\s.-]{7,}\d/g, '[phone]');

// Corps NestJS d'un 422 : on ne garde que « champ: règle » (jamais target ni value, qui contiennent les données de l'acheteur)
function describe(message: unknown): string {
  if (typeof message === 'string') return redact(message).slice(0, 300);
  if (!Array.isArray(message)) return '';
  return message
    .map((m: any) =>
      typeof m === 'string' ? redact(m) : [m?.property, Object.values(m?.constraints ?? {}).join(', ')].filter(Boolean).join(': '),
    )
    .filter(Boolean)
    .join('; ')
    .slice(0, 300);
}

const fieldsOf = (message: unknown): string[] =>
  Array.isArray(message) ? message.map((m: any) => m?.property).filter((p): p is string => typeof p === 'string') : [];

const intHeader = (res: Response, name: string) => {
  const v = Number.parseInt(res.headers.get(name) ?? '', 10);
  return Number.isFinite(v) ? v : null;
};

async function call(op: string, path: string, method: 'GET' | 'POST', body: unknown, timeoutMs: number) {
  if (maketouApiKeyProblem()) throw new MaketouError('MAKETOU_NOT_CONFIGURED', 'MAKETOU_API_KEY manquante ou mal formée');
  const key = readEnv('MAKETOU_API_KEY')!.trim();

  let res: Response;
  try {
    res = await fetch(baseUrl() + path, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    // N'importe quelle exception (réseau, délai, en-tête invalide…) : jamais l'erreur brute, qui peut contenir la clé
    throw new MaketouError('NETWORK_ERROR', `Maketou ${op} : ${(e as Error)?.name ?? 'erreur'}`);
  }

  let json: any;
  try {
    const text = await res.text();
    json = text ? JSON.parse(text) : null;
  } catch {
    json = undefined;
  }

  // Un 2xx illisible (page HTML de maintenance, corps tronqué) est une panne, pas une erreur de panier
  if (res.ok && (json === null || json === undefined || typeof json !== 'object')) {
    throw new MaketouError('MALFORMED_RESPONSE', `Maketou ${op} : réponse 2xx illisible`, res.status);
  }

  if (!res.ok) {
    const s = res.status;
    const code =
      s === 401 || s === 403 ? 'INVALID_API_KEY'
      : s === 404 ? 'CART_NOT_FOUND'
      : s === 429 ? 'RATE_LIMITED'
      : s >= 500 ? `HTTP_${s}`
      : (typeof json?.code === 'string' && json.code) || (s === 400 || s === 422 ? 'VALIDATION_ERROR' : `HTTP_${s}`);
    const detail = describe(json?.message);
    throw new MaketouError(
      code,
      `Maketou ${op} a échoué (${s})${detail ? ` : ${detail}` : ''}`,
      s,
      s === 429 ? intHeader(res, 'retry-after') : null,
      fieldsOf(json?.message),
    );
  }

  return {
    json,
    // Ces en-têtes ne décrivent que la fenêtre de 60 s propre à la clé
    rateLimitRemaining: intHeader(res, 'x-ratelimit-remaining'),
    rateLimitLimit: intHeader(res, 'x-ratelimit-limit'),
  };
}

const isHttps = (u: unknown) => {
  try {
    return new URL(String(u)).protocol === 'https:';
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────

export type CartCustomer = { email: string; firstName: string; lastName: string; phone?: string };

// Crée un panier pour un produit à prix fixe : Maketou facture le prix du dashboard (pas de customerPrice)
export async function createCart(input: {
  productDocumentId: string;
  redirectUrl: string;
  meta: Record<string, string>;
  customer: CartCustomer;
}): Promise<{ cartId: string; status: CartStatus; redirectUrl: string }> {
  const meta = Object.fromEntries(Object.entries(input.meta).filter(([, v]) => typeof v === 'string' && v));
  const { json } = await call(
    'createCart',
    '/api/v1/stores/cart/checkout',
    'POST',
    {
      productDocumentId: input.productDocumentId,
      email: input.customer.email,
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
      ...(input.customer.phone ? { phone: input.customer.phone } : {}),
      redirectURL: input.redirectUrl, // « URL » en majuscules : c'est le nom exact du champ
      ...(Object.keys(meta).length ? { meta } : {}),
    },
    15_000,
  );

  // Pas d'URL pour un panier qu'on ne pourrait jamais confirmer
  const cartId = json?.cart?.id;
  const url = json?.redirectUrl;
  if (typeof cartId !== 'string' || !UUID_RE.test(cartId) || typeof url !== 'string' || !isHttps(url)) {
    throw new MaketouError('INVALID_RESPONSE', 'réponse inattendue de createCart');
  }
  const status = CART_STATUSES.includes(json.cart.status) ? (json.cart.status as CartStatus) : 'waiting_payment';
  return { cartId, status, redirectUrl: url };
}

export type RetrievedCart = {
  status: CartStatus | null; // null = statut inconnu : ne jamais créditer
  paymentId: string | null; // existe dès waiting_payment : ce n'est jamais une preuve de paiement
  meta: Record<string, string>;
  rateLimitRemaining: number | null;
  rateLimitLimit: number | null;
};

// Seule preuve de paiement : status === 'completed' lu ici, côté serveur
export async function retrieveCart(cartId: string, timeoutMs = 15_000): Promise<RetrievedCart> {
  // Les 404 consomment aussi le quota : on ne demande pas un id mal formé
  if (!UUID_RE.test(cartId)) throw new MaketouError('CART_NOT_FOUND', "l'id de panier n'est pas un UUID");
  const { json, rateLimitRemaining, rateLimitLimit } = await call(
    'retrieveCart',
    `/api/v1/stores/cart/${cartId}`,
    'GET',
    undefined,
    timeoutMs,
  );
  if (typeof json?.id !== 'string' || json.id.toLowerCase() !== cartId.toLowerCase()) {
    throw new MaketouError('INVALID_RESPONSE', "l'id du panier renvoyé ne correspond pas");
  }
  const meta = Object.fromEntries(
    Object.entries(json.meta && typeof json.meta === 'object' ? json.meta : {}).filter(([, v]) => typeof v === 'string'),
  ) as Record<string, string>;
  return {
    status: CART_STATUSES.includes(json.status) ? (json.status as CartStatus) : null,
    paymentId: typeof json.paymentId === 'string' && json.paymentId ? json.paymentId : null,
    meta,
    rateLimitRemaining,
    rateLimitLimit,
  };
}

// Prénom / nom exigés par Maketou : profil → nom complet scindé → partie locale de l'email, nom « - »
export function customerName(fullName: string | null | undefined, email: string): { firstName: string; lastName: string } {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: email.split('@')[0] || 'Client', lastName: '-' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') || '-' };
}
