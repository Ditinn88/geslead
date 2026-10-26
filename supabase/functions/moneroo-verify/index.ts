// POST { ref } : la page de retour demande l'état d'un paiement si le webhook tarde.
// Interroge l'API Moneroo (source de vérité) et applique le même octroi que le webhook.
// Réponse : { status: 'completed' | 'pending' | 'failed' | 'expired' }
import { monerooSecretKey, verifyPayment } from '../_shared/moneroo.ts';
import { liveStatus, settlePayment, type PaymentRow } from '../_shared/settle.ts';
import { createAdminClient, makeSettleDeps, PAYMENT_COLUMNS } from '../_shared/db.ts';
import { getUser, json, preflight } from '../_shared/http.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return json({ code: 'METHOD_NOT_ALLOWED' }, 405);

  const secretKey = monerooSecretKey();
  if (!secretKey) return json({ code: 'PAYMENT_NOT_CONFIGURED' }, 503);

  const admin = createAdminClient();
  const user = await getUser(admin, req);
  if (!user) return json({ code: 'NOT_AUTHENTICATED' }, 401);

  const body = await req.json().catch(() => ({}));
  const ref = typeof body?.ref === 'string' && UUID_RE.test(body.ref) ? body.ref : null;
  if (!ref) return json({ code: 'PAYMENT_NOT_FOUND' }, 404);

  // Toujours limité aux paiements de l'utilisateur connecté
  const { data: payment, error } = await admin
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .eq('id', ref)
    .eq('payer_id', user.id)
    .maybeSingle<PaymentRow>();
  if (error) return json({ code: 'VERIFY_FAILED' }, 502);
  if (!payment) return json({ code: 'PAYMENT_NOT_FOUND' }, 404);
  if (payment.status === 'completed') return json({ status: 'completed' });
  if (!payment.provider_transaction_id) return json({ status: payment.status === 'pending' ? 'pending' : payment.status });

  const live = await verifyPayment(payment.provider_transaction_id, secretKey);
  if (!live) return json({ status: payment.status }); // Moneroo injoignable : on réessaiera

  try {
    const settlement = await settlePayment(
      payment,
      { status: liveStatus(live.status), amount: live.amount, currency: live.currency, failureReason: live.status },
      makeSettleDeps(admin),
    );
    if (settlement === 'completed' || settlement === 'already_completed') return json({ status: 'completed' });
    if (settlement === 'failed') return json({ status: 'failed' });
    if (settlement === 'amount_mismatch') return json({ code: 'VERIFY_FAILED' }, 502);
    return json({ status: payment.status === 'expired' ? 'expired' : 'pending' });
  } catch (e) {
    console.error(`vérification ${payment.id} : octroi impossible :`, (e as Error).message);
    return json({ code: 'VERIFY_FAILED' }, 502);
  }
});
