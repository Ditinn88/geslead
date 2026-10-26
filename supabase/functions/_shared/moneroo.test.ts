// Tests de l'adaptateur Moneroo, du catalogue et de l'octroi (HTTP et base simulés).
// Lancer : npm run test:moneroo
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  computeEventId,
  initiatePayment,
  monerooSecretKey,
  parseMonerooEvent,
  verifyMonerooSignature,
  verifyPayment,
} from './moneroo.ts';
import { appUrlProblem, loadCatalog } from './catalog.ts';
import { liveStatus, settlePayment, type PaymentRow, type SettleDeps } from './settle.ts';

const env = (globalThis as any).process.env;
let calls: Array<{ url: string; init: RequestInit }> = [];

function mockFetch(responses: Array<Response | Error>) {
  (globalThis as any).fetch = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next!;
  };
}
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  calls = [];
});

const params = {
  amount: 5000,
  currency: 'XOF',
  description: 'x'.repeat(250),
  returnUrl: 'https://geslead.africa/billing/moneroo/return?ref=abc',
  customerEmail: 'awa@exemple.sn',
  customerName: 'Awa',
  metadata: { paymentId: 'p-1', empty: '', missing: undefined, count: 3 },
};

// ---------- Adaptateur ----------

test('initiatePayment : forme de la requête (nom scindé, metadata en chaînes, description ≤ 200)', async () => {
  mockFetch([jsonResponse(200, { data: { id: 'py_1', checkout_url: 'https://checkout.moneroo.io/p/1' } })]);
  const res = await initiatePayment(params, 'mon_secret_key_123');
  assert.deepEqual(res, { ok: true, providerTransactionId: 'py_1', checkoutUrl: 'https://checkout.moneroo.io/p/1' });

  const sent = JSON.parse(String(calls[0].init.body));
  assert.equal(calls[0].url, 'https://api.moneroo.io/v1/payments/initialize');
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer mon_secret_key_123');
  assert.equal(sent.return_url, params.returnUrl);
  assert.deepEqual(sent.customer, { email: 'awa@exemple.sn', first_name: 'Awa', last_name: '-' });
  assert.deepEqual(sent.metadata, { paymentId: 'p-1', count: '3' });
  assert.equal(sent.description.length, 200);
  assert.equal('cancel_url' in sent, false);
});

test("initiatePayment : un 200 sans checkout_url est un échec", async () => {
  mockFetch([jsonResponse(200, { data: { id: 'py_1' } })]);
  const res = await initiatePayment(params, 'mon_secret_key_123');
  assert.equal(res.ok, false);
});

test('initiatePayment : une erreur réseau est réessayée une seule fois', async () => {
  mockFetch([new TypeError('fetch failed'), jsonResponse(200, { data: { id: 'py_2', checkout_url: 'https://c/2' } })]);
  assert.equal((await initiatePayment(params, 'mon_secret_key_123')).ok, true);
  assert.equal(calls.length, 2);

  calls = [];
  mockFetch([new TypeError('fetch failed'), new TypeError('fetch failed')]);
  assert.equal((await initiatePayment(params, 'mon_secret_key_123')).ok, false);
  assert.equal(calls.length, 2);
});

test('initiatePayment : erreur 422 → message et noms des champs, sans valeurs', async () => {
  mockFetch([jsonResponse(422, { message: 'The given data was invalid.', errors: { 'customer.first_name': ['requis'] } })]);
  const res = await initiatePayment(params, 'mon_secret_key_123');
  assert.equal(res.ok === false && res.error, 'The given data was invalid. [customer.first_name]');
});

test('verifyPayment : devise objet ou chaîne, montant chaîne, statut en minuscules', async () => {
  mockFetch([jsonResponse(200, { data: { status: 'SUCCESS', amount: '5000', currency: { code: 'XOF' } } })]);
  assert.deepEqual(await verifyPayment('py_1', 'k'), { status: 'success', amount: 5000, currency: 'XOF' });
  mockFetch([jsonResponse(404, { message: 'Not found' })]);
  assert.equal(await verifyPayment('py_1', 'k'), null);
  mockFetch([new TypeError('fetch failed')]);
  assert.equal(await verifyPayment('py_1', 'k'), null);
});

test('clé secrète : une clé Stripe ou trop courte est refusée', () => {
  env.MONEROO_SECRET_KEY = 'sk_live_abcdefghijk';
  assert.equal(monerooSecretKey(), null);
  env.MONEROO_SECRET_KEY = 'court';
  assert.equal(monerooSecretKey(), null);
  env.MONEROO_SECRET_KEY = '  mon_vraie_cle_moneroo  ';
  assert.equal(monerooSecretKey(), 'mon_vraie_cle_moneroo');
});

// ---------- Webhook ----------

const rawBody = new TextEncoder().encode(
  '{"event":"payment.success","data":{"id":"py_1","amount":5000,"currency":"XOF","metadata":{"paymentId":"p-1"}}}',
);
const sign = (body: Uint8Array, secret: string) => createHmac('sha256', secret).update(body).digest('hex');

test('signature : HMAC-SHA256 hex du corps brut, comparé en temps constant', async () => {
  const sig = sign(rawBody, 'whk_secret');
  assert.equal(await verifyMonerooSignature(rawBody, sig, 'whk_secret'), true);
  assert.equal(await verifyMonerooSignature(rawBody, sig.toUpperCase(), 'whk_secret'), true);
  assert.equal(await verifyMonerooSignature(rawBody, sig, 'autre_secret'), false);
  assert.equal(await verifyMonerooSignature(rawBody, null, 'whk_secret'), false);
  const tampered = new TextEncoder().encode(new TextDecoder().decode(rawBody).replace('5000', '50'));
  assert.equal(await verifyMonerooSignature(tampered, sig, 'whk_secret'), false);
});

test("dédoublonnage : identifiant d'événement stable pour un même corps", async () => {
  const a = await computeEventId(rawBody);
  assert.match(a, /^synthetic-[0-9a-f]{32}$/);
  assert.equal(a, await computeEventId(rawBody));
});

test('événements : success / failed / cancelled / initiated', () => {
  const ev = parseMonerooEvent(JSON.parse(new TextDecoder().decode(rawBody)));
  assert.deepEqual(ev, { providerTransactionId: 'py_1', reportedAmount: 5000, reportedCurrency: 'XOF', paymentId: 'p-1', status: 'completed' });
  assert.equal(parseMonerooEvent({ event: 'payment.failed', data: { id: 'py_1', status: 'failed' } })?.status, 'failed');
  assert.equal(parseMonerooEvent({ event: 'payment.cancelled', data: { id: 'py_1' } })?.failureReason, 'payment.cancelled');
  assert.equal(parseMonerooEvent({ event: 'payment.initiated', data: { id: 'py_1' } }), null);
  assert.equal(parseMonerooEvent({ event: 'payment.success', data: {} }), null);
});

// ---------- Catalogue ----------

test('catalogue : packs lus dans les variables, erreurs nommées par variable', () => {
  env.APP_URL = 'https://geslead.africa/';
  delete env.MONEROO_CURRENCY;
  env.MONEROO_PACK_1_CREDITS = '30';
  env.MONEROO_PACK_1_PRICE = '5000';
  env.MONEROO_PACK_2_CREDITS = 'trente';
  env.MONEROO_PACK_2_PRICE = '12000';
  let res = loadCatalog();
  assert.equal(res.catalog, null);
  assert.ok(res.problems.some((p) => p.startsWith('MONEROO_PACK_2_CREDITS')));

  delete env.MONEROO_PACK_2_CREDITS;
  delete env.MONEROO_PACK_2_PRICE;
  res = loadCatalog();
  assert.deepEqual(res.catalog, { appUrl: 'https://geslead.africa', currency: 'XOF', packs: [{ key: 'pack_1', credits: 30, price: 5000 }] });
  assert.ok(appUrlProblem('https://geslead.africa/app'));
  assert.equal(appUrlProblem('http://localhost:3000'), null);
});

// ---------- Octroi ----------

const payment: PaymentRow = {
  id: 'p-1', payer_id: 'u-1', amount_total: 5000, currency: 'XOF', status: 'pending', credits: 30, provider_transaction_id: 'py_1',
};

function deps() {
  const done: string[] = [];
  let granted = false;
  const d: SettleDeps = {
    complete: async (id) => {
      done.push(`complete:${id}`);
      if (granted) return false;
      granted = true;
      return true;
    },
    fail: async (id, reason) => {
      done.push(`fail:${id}:${reason}`);
      return true;
    },
    log: () => {},
  };
  return { d, done };
}

test('octroi : crédité une seule fois même si le webhook est rejoué', async () => {
  const { d } = deps();
  assert.equal(await settlePayment(payment, { status: 'completed', amount: 5000, currency: 'XOF' }, d), 'completed');
  assert.equal(await settlePayment(payment, { status: 'completed', amount: 5000, currency: 'XOF' }, d), 'already_completed');
});

test('octroi : montant ou devise différents → refusé, rien n accordé', async () => {
  const { d, done } = deps();
  assert.equal(await settlePayment(payment, { status: 'completed', amount: 50, currency: 'XOF' }, d), 'amount_mismatch');
  assert.equal(await settlePayment(payment, { status: 'completed', amount: 5000, currency: 'XAF' }, d), 'amount_mismatch');
  assert.deepEqual(done, []);
});

test('octroi : échec et attente', async () => {
  const { d, done } = deps();
  assert.equal(await settlePayment(payment, { status: 'failed', failureReason: 'cancelled' }, d), 'failed');
  assert.equal(await settlePayment(payment, { status: 'pending' }, d), 'pending');
  assert.deepEqual(done, ['fail:p-1:cancelled']);
  assert.equal(liveStatus('success'), 'completed');
  assert.equal(liveStatus('cancelled'), 'failed');
  assert.equal(liveStatus('pending'), 'pending');
});
