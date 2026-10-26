// Webhook Moneroo (URL à coller dans Moneroo → Developers → Webhooks).
// Signature → événement → dédoublonnage → ré-interrogation de Moneroo → contrôles → octroi unique.
import {
  computeEventId,
  monerooSecretKey,
  monerooWebhookSecret,
  parseMonerooEvent,
  verifyMonerooSignature,
  verifyPayment,
} from '../_shared/moneroo.ts';
import { liveStatus, settlePayment, type PaymentRow } from '../_shared/settle.ts';
import { createAdminClient, makeSettleDeps, PAYMENT_COLUMNS } from '../_shared/db.ts';
import { json } from '../_shared/http.ts';

const PROVIDER = 'moneroo';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const webhookSecret = monerooWebhookSecret();
  const secretKey = monerooSecretKey();
  if (!webhookSecret || !secretKey) {
    console.error('[WEBHOOK] MONEROO_WEBHOOK_SECRET ou MONEROO_SECRET_KEY absent');
    return json({ error: 'webhook not configured' }, 500);
  }

  // 1. Corps BRUT : la signature porte sur les octets reçus, pas sur un JSON re-sérialisé
  const rawBody = new Uint8Array(await req.arrayBuffer());
  if (!(await verifyMonerooSignature(rawBody, req.headers.get('x-moneroo-signature'), webhookSecret))) {
    console.error('[WEBHOOK] signature Moneroo invalide');
    return json({ error: 'invalid signature' }, 401);
  }

  // 2. Événement normalisé (payment.initiated et inconnus : accusés sans action)
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return json({ received: true, ignored: true });
  }
  const event = parseMonerooEvent(body);
  if (!event) return json({ received: true, ignored: true });

  // 3. Dédoublonnage : Moneroo renvoie le même webhook plusieurs fois
  const admin = createAdminClient();
  const eventId = await computeEventId(rawBody);
  const markProcessed = () =>
    admin.from('processed_events').upsert({ provider: PROVIDER, event_id: eventId }, { ignoreDuplicates: true });
  const { data: seen } = await admin
    .from('processed_events')
    .select('event_id')
    .eq('provider', PROVIDER)
    .eq('event_id', eventId)
    .maybeSingle();
  if (seen) return json({ received: true, deduped: true });

  // 4. Ligne de paiement retrouvée par l'id Moneroo
  const { data: payment, error } = await admin
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .eq('provider_transaction_id', event.providerTransactionId)
    .maybeSingle<PaymentRow>();
  if (error) {
    console.error('[WEBHOOK] lecture du paiement impossible :', error.message);
    return json({ error: 'database error' }, 500); // Moneroo réessaiera
  }
  if (!payment) {
    console.error('[WEBHOOK] paiement introuvable pour', event.providerTransactionId);
    await markProcessed();
    return json({ received: true, orphaned: true }); // 200 : inutile de faire réessayer
  }

  // 5. Le paiement Moneroo doit bien porter notre id de ligne
  if (event.paymentId && event.paymentId !== payment.id) {
    console.error('[WEBHOOK] metadata.paymentId ne correspond pas à la ligne', payment.id);
    return json({ error: 'payment mismatch' }, 403);
  }

  // 6. Défense en profondeur : on ne crédite que si l'API Moneroo confirme le succès
  let outcome: { status: 'completed' | 'failed' | 'pending'; amount?: number; currency?: string; failureReason?: string } = {
    status: event.status,
    amount: event.reportedAmount,
    currency: event.reportedCurrency,
    failureReason: event.failureReason,
  };
  if (event.status === 'completed') {
    const live = await verifyPayment(event.providerTransactionId, secretKey);
    if (live && liveStatus(live.status) !== 'completed') {
      outcome = { status: 'failed', failureReason: `Re-query mismatch: live=${live.status}` };
    } else if (live) {
      outcome = {
        status: 'completed',
        amount: typeof live.amount === 'number' ? live.amount : event.reportedAmount,
        currency: live.currency || event.reportedCurrency,
      };
    }
  }

  // 7. Contrôle du montant + transition atomique + octroi des crédits (une seule fois)
  let settlement;
  try {
    settlement = await settlePayment(payment, outcome, makeSettleDeps(admin));
  } catch (e) {
    console.error(`[WEBHOOK] octroi impossible pour ${payment.id} :`, (e as Error).message);
    return json({ error: 'fulfillment failed' }, 500); // Moneroo réessaiera
  }
  if (settlement === 'amount_mismatch') return json({ error: 'Amount mismatch' }, 400);

  await admin
    .from('payments')
    .update({ webhook_received_at: new Date().toISOString() })
    .eq('id', payment.id);

  // 8. Dédoublonnage enregistré, 200
  await markProcessed();
  return json({ received: true, status: settlement });
});
