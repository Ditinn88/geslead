// POST { cartId? } : la page de retour demande si le panier Maketou est payé.
// Maketou n'envoie pas de webhook : on l'interroge ici, à rythme limité, et le job de rattrapage fait le reste.
// Réponse : { status: 'completed' | 'waiting_payment' | 'payment_failed' | 'abandoned' | 'checking', retryAfterMs? }
import { isConfigError, maketouApiKeyProblem, UUID_RE } from '../_shared/maketou.ts';
import { syncPayment, type MaketouPaymentRow } from '../_shared/maketou-sync.ts';
import { claimPaymentCheck, makeMaketouSyncDeps, MAKETOU_PAYMENT_COLUMNS } from '../_shared/maketou-db.ts';
import { createAdminClient } from '../_shared/db.ts';
import { getUser, json, preflight } from '../_shared/http.ts';

const CONFIRM_TIMEOUT_MS = 8_000; // délai total court : l'acheteur attend devant la page
const RETRY_MS = 4_000;
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ code: 'METHOD_NOT_ALLOWED' }, 405);

  if (maketouApiKeyProblem()) return json({ code: 'MAKETOU_NOT_CONFIGURED' }, 503);

  const admin = createAdminClient();
  const user = await getUser(admin, req);
  if (!user) return json({ code: 'NOT_AUTHENTICATED' }, 401);

  // Toujours limité aux paiements de l'acheteur connecté ; sans id de panier valide, son dernier achat
  const body = await req.json().catch(() => ({}));
  const cartId = typeof body?.cartId === 'string' && UUID_RE.test(body.cartId) ? body.cartId : null;
  const base = admin.from('payments').select(MAKETOU_PAYMENT_COLUMNS).eq('payer_id', user.id).eq('provider', 'maketou');
  const query = cartId
    ? base.ilike('provider_transaction_id', cartId).gte('created_at', hoursAgo(72))
    : base.not('provider_transaction_id', 'is', null).gte('created_at', hoursAgo(48)).order('created_at', { ascending: false });
  const { data: row, error } = await query.limit(1).maybeSingle<MaketouPaymentRow>();
  if (error) {
    console.error('lecture du paiement impossible :', error.message);
    return json({ code: 'MAKETOU_CONFIRM_FAILED' }, 502);
  }
  if (!row) return json({ code: 'CHECKOUT_NOT_FOUND' }, 404);

  // Seule une ligne close donne une réponse définitive sans interroger Maketou
  if (row.status === 'completed') return json({ status: 'completed' });
  if (row.status === 'failed') return json({ status: 'payment_failed' });
  if (row.status === 'expired') return json({ status: 'abandoned' });

  try {
    // Maketou non interrogé (créneau pris) : « checking », jamais le statut stocké, peut-être périmé
    if (!(await claimPaymentCheck(admin, row.id, user.id))) return json({ status: 'checking', retryAfterMs: RETRY_MS });

    const result = await syncPayment(row, CONFIRM_TIMEOUT_MS, makeMaketouSyncDeps(admin));
    switch (result.kind) {
      case 'granted':
      case 'already_completed':
        return json({ status: 'completed' });
      case 'pending':
        return json({ status: result.providerStatus });
      case 'closed':
        return json({ status: result.providerStatus === 'payment_failed' ? 'payment_failed' : 'abandoned' });
      case 'rate_limited':
        return json({ status: 'checking', retryAfterMs: Math.max(RETRY_MS, (result.retryAfterSec ?? 0) * 1000) });
      default:
        console.error(`confirmation ${row.id} : ${result.code}`);
        return isConfigError(result.code)
          ? json({ code: 'MAKETOU_NOT_CONFIGURED' }, 503)
          : json({ code: 'MAKETOU_CONFIRM_FAILED' }, 502);
    }
  } catch (e) {
    console.error(`confirmation ${row.id} : ${(e as Error).message}`);
    return json({ code: 'MAKETOU_CONFIRM_FAILED' }, 502);
  }
});
