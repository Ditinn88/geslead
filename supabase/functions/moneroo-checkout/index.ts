// GET  : catalogue public des packs de crédits (page Tarifs, modale d'achat)
// POST : { packKey } → crée le paiement Moneroo et renvoie l'URL de la page de paiement
import { initiatePayment, monerooSecretKey } from '../_shared/moneroo.ts';
import { loadCatalog, RETURN_PATH } from '../_shared/catalog.ts';
import { createAdminClient } from '../_shared/db.ts';
import { getUser, json, preflight } from '../_shared/http.ts';

const MAX_PENDING_PER_HOUR = 10;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const { catalog, problems } = loadCatalog();
  const secretKey = monerooSecretKey();
  if (!catalog || !secretKey) {
    console.error('Moneroo non configuré :', [...problems, secretKey ? '' : 'MONEROO_SECRET_KEY manquante ou invalide'].filter(Boolean).join(' | '));
    return json({ code: 'PAYMENT_NOT_CONFIGURED' }, 503);
  }

  if (req.method === 'GET') {
    return json({
      currency: catalog.currency,
      packs: catalog.packs.map(({ key, credits, price }) => ({ key, credits, price })),
    });
  }
  if (req.method !== 'POST') return json({ code: 'METHOD_NOT_ALLOWED' }, 405);

  const admin = createAdminClient();
  const user = await getUser(admin, req);
  if (!user) return json({ code: 'NOT_AUTHENTICATED' }, 401);

  // Le prix vient du catalogue serveur, jamais du navigateur
  const body = await req.json().catch(() => ({}));
  const pack = catalog.packs.find((p) => p.key === body?.packKey);
  if (!pack) return json({ code: 'UNKNOWN_PACK' }, 400);

  // Moneroo exige un email : on n'en invente jamais
  if (!user.email) return json({ code: 'EMAIL_REQUIRED' }, 400);

  // La cible de l'octroi doit exister avant de vendre (comptes antérieurs au trigger)
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileError) {
    console.error('profil introuvable et non créé :', profileError.message);
    return json({ code: 'CHECKOUT_FAILED' }, 500);
  }

  // Anti-abus : nombre de paiements ouverts par heure
  const { count } = await admin
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('payer_id', user.id)
    .eq('status', 'pending')
    .gte('created_at', new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= MAX_PENDING_PER_HOUR) return json({ code: 'TOO_MANY_CHECKOUTS' }, 429);

  // 1. Ligne « pending » AVANT d'appeler Moneroo : le webhook peut arriver avant la réponse HTTP
  const { data: payment, error: insertError } = await admin
    .from('payments')
    .insert({
      payer_id: user.id,
      provider: 'moneroo',
      amount_total: pack.price,
      currency: catalog.currency,
      payment_type: 'credits',
      reference_id: pack.key,
      credits: pack.credits,
      customer_email: user.email,
    })
    .select('id')
    .single();
  if (insertError || !payment) {
    console.error('création du paiement impossible :', insertError?.message);
    return json({ code: 'CHECKOUT_FAILED' }, 500);
  }

  // 2. Initialisation chez Moneroo, avec notre id dans metadata.paymentId
  const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined;
  const result = await initiatePayment(
    {
      amount: pack.price,
      currency: catalog.currency,
      description: `GESLEAD — Pack ${pack.credits} crédits`,
      // « ref » et non « paymentId » : Moneroo ajoute son propre paymentId au retour
      returnUrl: `${catalog.appUrl}${RETURN_PATH}?ref=${payment.id}`,
      customerEmail: user.email,
      customerName: fullName,
      metadata: { paymentId: payment.id, packKey: pack.key, userId: user.id },
    },
    secretKey,
  );

  if (!result.ok) {
    console.error(`initialisation Moneroo refusée pour ${payment.id} : ${result.error}`);
    await admin.rpc('fail_credit_payment', { p_payment: payment.id, p_reason: 'initialize_failed' });
    return json({ code: 'CHECKOUT_FAILED' }, 502);
  }

  // 3. On mémorise l'id Moneroo : c'est par lui que le webhook retrouvera la ligne
  const { error: updateError } = await admin
    .from('payments')
    .update({
      provider_transaction_id: result.providerTransactionId,
      checkout_url: result.checkoutUrl,
      metadata: { packKey: pack.key },
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);
  if (updateError) {
    // Sans l'id Moneroo, le paiement ne pourrait jamais être confirmé : on ne renvoie pas l'URL
    console.error(`enregistrement de l'id Moneroo impossible pour ${payment.id} :`, updateError.message);
    return json({ code: 'CHECKOUT_FAILED' }, 500);
  }

  return json({ checkoutUrl: result.checkoutUrl, paymentId: payment.id });
});
