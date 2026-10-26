// Cœur commun de la confirmation (page de retour) et du job de rattrapage : seul code qui lit le statut
// d'un panier Maketou et agit dessus. L'octroi lui-même est fait en SQL par complete_credit_payment()
// (transition gardée par le statut + credit_ledger.payment_id unique : une seule fois par paiement).
import { MaketouError, isConfigError, isOutage, retrieveCart, type CartStatus } from './maketou.ts';

export const PENDING_WINDOW_MS = 48 * 3600_000; // au-delà, un panier toujours non payé est clos
export const CART_ERROR_GRACE_MS = 72 * 3600_000; // erreur propre au panier : clos seulement après ce délai
export const OUTAGE_STREAK_LIMIT = 3;
export const LOW_QUOTA_RATIO = 0.1; // on laisse 10 % du quota Maketou aux pages de retour

// Ligne `payments` d'un achat Maketou (provider_transaction_id = id du panier)
export type MaketouPaymentRow = {
  id: string;
  payer_id: string;
  status: string; // pending | completed | failed | expired
  provider_transaction_id: string | null;
  created_at: string;
};

type Quota = { remaining: number | null; limit: number | null } | null;

export type SyncResult =
  | { kind: 'granted' | 'already_completed'; quota: Quota }
  | { kind: 'pending' | 'closed'; providerStatus: CartStatus; quota: Quota }
  | { kind: 'rate_limited'; retryAfterSec: number | null; quota: Quota }
  | { kind: 'error'; code: string; httpStatus: number | null; quota: Quota };

export interface SyncDeps {
  complete(paymentId: string, providerPaymentId: string | null): Promise<boolean>; // true = crédits accordés maintenant
  recordStatus(paymentId: string, providerStatus: CartStatus, close: 'failed' | 'expired' | null): Promise<void>;
  log(message: string): void;
}

export async function syncPayment(
  row: MaketouPaymentRow,
  timeoutMs: number,
  deps: SyncDeps,
  now = Date.now(),
): Promise<SyncResult> {
  if (row.status === 'completed') return { kind: 'already_completed', quota: null };
  if (!row.provider_transaction_id) return { kind: 'error', code: 'CART_NOT_FOUND', httpStatus: null, quota: null };

  let cart;
  try {
    cart = await retrieveCart(row.provider_transaction_id, timeoutMs);
  } catch (e) {
    const err = e instanceof MaketouError ? e : new MaketouError('NETWORK_ERROR', 'erreur inattendue');
    if (err.code === 'RATE_LIMITED') return { kind: 'rate_limited', retryAfterSec: err.retryAfterSec, quota: null };
    return { kind: 'error', code: err.code, httpStatus: err.httpStatus, quota: null };
  }
  const quota = { remaining: cart.rateLimitRemaining, limit: cart.rateLimitLimit };

  // Ne jamais créditer le panier d'une autre ligne ou d'un autre compte (ids comparés en chaînes)
  const { userId, paymentId } = cart.meta;
  if ((userId && userId !== String(row.payer_id)) || (paymentId && paymentId !== String(row.id))) {
    deps.log(`paiement ${row.id} : le panier Maketou porte un autre compte ou une autre ligne`);
    return { kind: 'error', code: 'CART_USER_MISMATCH', httpStatus: null, quota };
  }
  if (cart.status === null) return { kind: 'error', code: 'UNKNOWN_CART_STATUS', httpStatus: null, quota };

  if (cart.status === 'completed') {
    const granted = await deps.complete(row.id, cart.paymentId);
    return { kind: granted ? 'granted' : 'already_completed', quota };
  }

  const windowOver = now - Date.parse(row.created_at) > PENDING_WINDOW_MS;
  const close = windowOver ? (cart.status === 'payment_failed' ? 'failed' : 'expired') : null;
  await deps.recordStatus(row.id, cart.status, close);
  return { kind: windowOver ? 'closed' : 'pending', providerStatus: cart.status, quota };
}

// ─────────────────────────────────────────────────────────────────────────
// Job de rattrapage (toutes les 5 min) : crédite l'acheteur qui a payé puis fermé l'onglet
// ─────────────────────────────────────────────────────────────────────────

export interface ReconcileDeps {
  listDue(): Promise<MaketouPaymentRow[]>; // jeunes paniers d'abord, avec des places réservées aux anciens
  claim(paymentId: string): Promise<boolean>; // créneau par panier, partagé avec la page de retour
  sync(row: MaketouPaymentRow): Promise<SyncResult>;
  expire(paymentId: string, reason: string): Promise<void>;
  log(message: string): void;
  now(): number;
}

export type ReconcileSummary = {
  checked: number;
  granted: number;
  closed: number;
  expired: number;
  stopReason: 'done' | 'budget' | 'rate_limited' | 'low_quota' | 'config' | 'outage';
};

export async function reconcile(deps: ReconcileDeps, opts: { budgetMs: number; callTimeoutMs: number }): Promise<ReconcileSummary> {
  const start = deps.now();
  const summary: ReconcileSummary = { checked: 0, granted: 0, closed: 0, expired: 0, stopReason: 'done' };
  let outages = 0;
  const outage = () => (++outages >= OUTAGE_STREAK_LIMIT ? 'outage' : null);

  // Traite une ligne ; renvoie la raison d'arrêter le passage, ou null pour continuer
  const processRow = async (row: MaketouPaymentRow): Promise<ReconcileSummary['stopReason'] | null> => {
    // Créneau pris par une page de retour à l'instant : on passe
    if (!(await deps.claim(row.id))) return null;
    const result = await deps.sync(row);
    summary.checked++;

    if (result.kind === 'rate_limited') return 'rate_limited';
    if (result.kind === 'error') {
      if (isConfigError(result.code)) return 'config';
      // Jamais de clôture sur une panne : le panier a peut-être été payé entre-temps
      if (isOutage(result.code)) return outage();
      outages = 0;
      const cartLevel = result.code === 'CART_NOT_FOUND' || result.code === 'CART_USER_MISMATCH' || result.code === 'UNKNOWN_CART_STATUS';
      if (cartLevel && deps.now() - Date.parse(row.created_at) > CART_ERROR_GRACE_MS) {
        deps.log(`rattrapage ${row.id} : clos après ${result.code}`);
        await deps.expire(row.id, result.code);
        summary.expired++;
      } else {
        deps.log(`rattrapage ${row.id} : ${result.code}`);
      }
      return null;
    }

    outages = 0;
    if (result.kind === 'granted') summary.granted++;
    if (result.kind === 'closed') summary.closed++;
    const remaining = result.quota?.remaining ?? null;
    const limit = result.quota?.limit ?? 600;
    return remaining !== null && remaining < limit * LOW_QUOTA_RATIO ? 'low_quota' : null;
  };

  for (const row of await deps.listDue()) {
    if (deps.now() - start + opts.callTimeoutMs > opts.budgetMs) {
      summary.stopReason = 'budget';
      break;
    }
    let stop: ReconcileSummary['stopReason'] | null;
    try {
      stop = await processRow(row);
    } catch (e) {
      // Une ligne qui plante ne bloque jamais les suivantes
      deps.log(`rattrapage ${row.id} : ${(e as Error)?.message ?? 'erreur'}`);
      stop = outage();
    }
    if (stop) {
      summary.stopReason = stop;
      break;
    }
  }
  return summary;
}
