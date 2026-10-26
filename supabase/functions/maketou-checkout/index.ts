// GET  : catalogue public des packs de crédits (page Tarifs, modale d'achat)
// POST : { packKey } → crée un panier Maketou et renvoie l'URL de sa page de paiement
import { createCart, customerName, maketouApiKeyProblem, MaketouError } from '../_shared/maketou.ts';
import { loadMaketouCatalog, MAKETOU_RETURN_PATH } from '../_shared/maketou-catalog.ts';
import { createAdminClient } from '../_shared/db.ts';
import { getUser, json, preflight } from '../_shared/http.ts';

const MAX_OPEN_PER_HOUR = 10;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const { catalog, problems, warnings } = loadMaketouCatalog();
  const keyProblem = maketouApiKeyProblem();
  if (warnings.length) console.warn('Maketou :', warnings.join(' | '));
  if (!catalog || keyProblem) {
    console.error('Maketou non configuré :', [...problems, keyProblem].filter(Boolean).join(' | '));
    return json({ code: 'MAKETOU_NOT_CONFIGURED' }, 503);
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

  // Le pack et son prix viennent du catalogue serveur, jamais du navigateur
  const body = await req.json().catch(() => ({}));
  const pack = catalog.packs.find((p) => p.key === body?.packKey);
  if (!pack) return json({ code: 'UNKNOWN_PACK' }, 400);

  // Maketou exige un email : on n'en invente jamais
  if (!user.email) return json({ code: 'EMAIL_REQUIRED' }, 400);

  // La cible de l'octroi doit exister avant de vendre (comptes antérieurs au trigger)
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileError) {
    console.error('profil introuvable et non créé :', profileError.message);
    return json({ code: 'MAKETOU_CHECKOUT_FAILED' }, 500);
  }

  // 1. Ligne « pending » (instantané du prix et des crédits) + plafond par acheteur, atomiquement en SQL
  const { data: paymentId, error: openError } = await admin.rpc('open_credit_payment', {
    p_payer: user.id,
    p_provider: 'maketou',
    p_reference: pack.key,
    p_credits: pack.credits,
    p_amount: pack.price,
    p_currency: catalog.currency,
    p_email: user.email,
    p_max_open_per_hour: MAX_OPEN_PER_HOUR,
  });
  if (openError?.message?.includes('TOO_MANY_CHECKOUTS')) return json({ code: 'TOO_MANY_CHECKOUTS' }, 429);
  if (openError || typeof paymentId !== 'string') {
    console.error('création du paiement impossible :', openError?.message);
    return json({ code: 'MAKETOU_CHECKOUT_FAILED' }, 500);
  }

  // 2. Panier Maketou, avec nos ids dans meta (relus et contrôlés à la confirmation)
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const fullName = profile?.full_name || (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null);
  let cart;
  try {
    cart = await createCart({
      productDocumentId: pack.productId,
      // Chemin sans paramètre : Maketou y ajoute l'id du panier
      redirectUrl: `${catalog.appUrl}${MAKETOU_RETURN_PATH}`,
      meta: { paymentId, userId: user.id, packKey: pack.key },
      customer: { email: user.email, ...customerName(fullName, user.email) },
    });
  } catch (e) {
    const err = e instanceof MaketouError ? e : new MaketouError('NETWORK_ERROR', 'erreur inattendue');
    console.error(`panier Maketou refusé pour ${paymentId} : ${err.code} — ${err.message}`);
    // La ligne passe en échec : elle ne compte plus dans le plafond de l'acheteur
    await admin.rpc('fail_credit_payment', { p_payment: paymentId, p_reason: err.code });
    return json({ code: 'MAKETOU_CHECKOUT_FAILED' }, 502);
  }

  // 3. Id du panier enregistré : sans lui le paiement ne pourrait jamais être confirmé, donc pas d'URL
  const { error: updateError } = await admin
    .from('payments')
    .update({
      provider_transaction_id: cart.cartId,
      provider_status: cart.status,
      checkout_url: cart.redirectUrl,
      metadata: { packKey: pack.key },
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);
  if (updateError) {
    console.error(`enregistrement du panier impossible pour ${paymentId} :`, updateError.message);
    await admin.rpc('fail_credit_payment', { p_payment: paymentId, p_reason: 'cart_not_recorded' });
    return json({ code: 'MAKETOU_CHECKOUT_FAILED' }, 500);
  }

  return json({ checkoutUrl: cart.redirectUrl, cartId: cart.cartId });
});
