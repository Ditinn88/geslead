// Tests du client Maketou, du catalogue, de la synchronisation et du job de rattrapage (HTTP et base simulés).
// Lancer : npm run test:maketou
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createCart, customerName, MaketouError, maketouApiKeyProblem, retrieveCart } from './maketou.ts';
import { loadMaketouCatalog, maketouAppUrlProblem } from './maketou-catalog.ts';
import { reconcile, syncPayment, type MaketouPaymentRow, type ReconcileDeps, type SyncDeps, type SyncResult } from './maketou-sync.ts';

const env = (globalThis as any).process.env;
const KEY = 'mk_live_0123456789abcdef';
const CART = '0b7e7c1e-2f4a-4c55-9a51-3d7f1b2a9c10';
const PRODUCT = '6f1c2d3e-4b5a-4978-8a1b-2c3d4e5f6a7b';
let calls: Array<{ url: string; init: RequestInit }> = [];

function mockFetch(responses: Array<Response | Error>) {
  (globalThis as any).fetch = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error('appel HTTP inattendu');
    if (next instanceof Error) throw next;
    return next;
  };
}
const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

async function rejectsWith(promise: Promise<unknown>, expected: Partial<MaketouError>) {
  await assert.rejects(promise, (e: unknown) => {
    assert.ok(e instanceof MaketouError, `MaketouError attendue, reçu ${e}`);
    for (const [k, v] of Object.entries(expected)) assert.deepEqual((e as any)[k], v, `champ ${k}`);
    return true;
  });
}

beforeEach(() => {
  calls = [];
  env.MAKETOU_API_KEY = KEY;
  delete env.MAKETOU_API_URL;
});

const cartInput = {
  productDocumentId: PRODUCT,
  redirectUrl: 'https://geslead.africa/billing/maketou/return',
  meta: { paymentId: 'p-1', userId: 'u-1', empty: '' },
  customer: { email: 'awa@exemple.sn', firstName: 'Awa', lastName: '-' },
};
const cartCreated = { cart: { id: CART, status: 'waiting_payment' }, redirectUrl: 'https://checkout.example/p/1' };

// ---------- Client : création du panier ----------

test('createCart : forme de la requête (redirectURL, meta en chaînes non vides, ni téléphone ni customerPrice)', async () => {
  mockFetch([jsonResponse(201, cartCreated)]);
  const res = await createCart(cartInput);
  assert.deepEqual(res, { cartId: CART, status: 'waiting_payment', redirectUrl: 'https://checkout.example/p/1' });

  assert.equal(calls[0].url, 'https://api.maketou.net/api/v1/stores/cart/checkout');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, `Bearer ${KEY}`);
  const sent = JSON.parse(String(calls[0].init.body));
  assert.deepEqual(sent, {
    productDocumentId: PRODUCT,
    email: 'awa@exemple.sn',
    firstName: 'Awa',
    lastName: '-',
    redirectURL: cartInput.redirectUrl,
    meta: { paymentId: 'p-1', userId: 'u-1' },
  });
});

test('createCart : réponse inexploitable → INVALID_RESPONSE, aucune URL renvoyée', async () => {
  mockFetch([jsonResponse(201, { cart: { id: 'pas-un-uuid' }, redirectUrl: 'https://c/1' })]);
  await rejectsWith(createCart(cartInput), { code: 'INVALID_RESPONSE' });
  mockFetch([jsonResponse(201, { cart: { id: CART }, redirectUrl: 'http://c/1' })]);
  await rejectsWith(createCart(cartInput), { code: 'INVALID_RESPONSE' });
  mockFetch([jsonResponse(201, { cart: { id: CART } })]);
  await rejectsWith(createCart(cartInput), { code: 'INVALID_RESPONSE' });
});

test('createCart : 422 NestJS sans code → VALIDATION_ERROR, champs et règles seulement, sans données acheteur', async () => {
  mockFetch([
    jsonResponse(422, {
      message: [
        { property: 'redirectURL', constraints: { isUrl: 'redirectURL must be a URL address' }, target: { email: 'awa@exemple.sn' }, value: 'http://localhost' },
      ],
      error: 'Unprocessable Entity',
      statusCode: 422,
    }),
  ]);
  await assert.rejects(createCart(cartInput), (e: any) => {
    assert.equal(e.code, 'VALIDATION_ERROR');
    assert.deepEqual(e.fields, ['redirectURL']);
    assert.match(e.message, /redirectURL: redirectURL must be a URL address/);
    assert.doesNotMatch(e.message, /awa@|localhost/);
    return true;
  });
});

// ---------- Client : classement des erreurs ----------

test('erreurs classées par statut HTTP d abord, corps ensuite', async () => {
  const cases: Array<[Response, Partial<MaketouError>]> = [
    [jsonResponse(401, { code: 'INVALID_API_KEY' }), { code: 'INVALID_API_KEY', httpStatus: 401 }],
    [jsonResponse(403, {}), { code: 'INVALID_API_KEY' }],
    [jsonResponse(404, {}), { code: 'CART_NOT_FOUND', httpStatus: 404 }],
    [jsonResponse(429, { code: 'RATE_LIMITED' }, { 'Retry-After': '7' }), { code: 'RATE_LIMITED', retryAfterSec: 7 }],
    // Un code de corps bizarre ne doit jamais faire passer une panne pour une erreur de panier
    [jsonResponse(503, { code: 'CART_NOT_FOUND' }), { code: 'HTTP_503' }],
    [jsonResponse(400, { code: 'INVALID_PRODUCT' }), { code: 'INVALID_PRODUCT' }],
    [jsonResponse(422, { code: 'VALIDATION_ERROR' }), { code: 'VALIDATION_ERROR' }],
  ];
  for (const [response, expected] of cases) {
    mockFetch([response]);
    await rejectsWith(retrieveCart(CART), expected);
  }
});

test("n'importe quelle exception de fetch devient NETWORK_ERROR, sans la clé dans le message", async () => {
  mockFetch([new TypeError(`Invalid header value: Bearer ${KEY}`)]);
  await assert.rejects(retrieveCart(CART), (e: any) => {
    assert.equal(e.code, 'NETWORK_ERROR');
    assert.doesNotMatch(e.message, new RegExp(KEY));
    return true;
  });
});

test('un 200 illisible (page HTML de maintenance) est MALFORMED_RESPONSE', async () => {
  mockFetch([new Response('<html>Maintenance</html>', { status: 200, headers: { 'Content-Type': 'text/html' } })]);
  await rejectsWith(retrieveCart(CART), { code: 'MALFORMED_RESPONSE' });
  mockFetch([new Response('', { status: 200 })]);
  await rejectsWith(retrieveCart(CART), { code: 'MALFORMED_RESPONSE' });
});

test('clé absente ou mal collée : MAKETOU_NOT_CONFIGURED, sans appel HTTP', async () => {
  for (const bad of ['', 'abc # ma clé', '"abc"', 'abc def', '“abc”']) {
    env.MAKETOU_API_KEY = bad;
    assert.ok(maketouApiKeyProblem(), `clé refusée : ${JSON.stringify(bad)}`);
  }
  mockFetch([]);
  await rejectsWith(retrieveCart(CART), { code: 'MAKETOU_NOT_CONFIGURED' });
  assert.equal(calls.length, 0);
  env.MAKETOU_API_KEY = `  ${KEY}  `;
  assert.equal(maketouApiKeyProblem(), null);
});

// ---------- Client : lecture du panier ----------

test('retrieveCart : statut, paymentId, meta en chaînes, quota ; id comparé sans casse', async () => {
  mockFetch([
    jsonResponse(
      200,
      { id: CART.toUpperCase(), status: 'waiting_payment', paymentId: 'pay_1', meta: { userId: 'u-1', n: 3 } },
      { 'X-RateLimit-Remaining': '42', 'X-RateLimit-Limit': '600' },
    ),
  ]);
  assert.deepEqual(await retrieveCart(CART), {
    status: 'waiting_payment',
    paymentId: 'pay_1',
    meta: { userId: 'u-1' },
    rateLimitRemaining: 42,
    rateLimitLimit: 600,
  });
  assert.equal(calls[0].url, `https://api.maketou.net/api/v1/stores/cart/${CART}`);
});

test('retrieveCart : statut inconnu → null ; id différent → INVALID_RESPONSE ; id mal formé → aucun appel', async () => {
  mockFetch([jsonResponse(200, { id: CART, status: 'paid' })]);
  assert.equal((await retrieveCart(CART)).status, null);
  mockFetch([jsonResponse(200, { id: PRODUCT, status: 'completed' })]);
  await rejectsWith(retrieveCart(CART), { code: 'INVALID_RESPONSE' });
  mockFetch([]);
  await rejectsWith(retrieveCart('../admin'), { code: 'CART_NOT_FOUND' });
  assert.equal(calls.length, 2);
});

test('customerName : nom complet scindé, sinon partie locale de l email', () => {
  assert.deepEqual(customerName('Awa Diop Ndiaye', 'a@b.sn'), { firstName: 'Awa', lastName: 'Diop Ndiaye' });
  assert.deepEqual(customerName('Awa', 'a@b.sn'), { firstName: 'Awa', lastName: '-' });
  assert.deepEqual(customerName('  ', 'moussa.fall@b.sn'), { firstName: 'moussa.fall', lastName: '-' });
});

// ---------- Catalogue ----------

function setPacks(vars: Record<string, string | undefined>) {
  for (const k of Object.keys(env)) if (k.startsWith('MAKETOU_PACK_')) delete env[k];
  for (const [k, v] of Object.entries(vars)) if (v !== undefined) env[k] = v;
}

test('catalogue : packs lus dans les variables, erreurs nommées par variable', () => {
  env.APP_URL = 'https://geslead.africa/';
  delete env.MAKETOU_CURRENCY;
  setPacks({ MAKETOU_PACK_1_PRODUCT_ID: PRODUCT, MAKETOU_PACK_1_CREDITS: '15', MAKETOU_PACK_1_PRICE: '2000', MAKETOU_PACK_2_CREDITS: '45', MAKETOU_PACK_2_PRICE: '5000' });
  let res = loadMaketouCatalog();
  assert.equal(res.catalog, null);
  assert.deepEqual(res.problems, ['MAKETOU_PACK_2_PRODUCT_ID manquante']);

  setPacks({ MAKETOU_PACK_1_PRODUCT_ID: PRODUCT, MAKETOU_PACK_1_CREDITS: '15', MAKETOU_PACK_1_PRICE: '2000', MAKETOU_PACK_3_PRODUCT_ID: 'abc', MAKETOU_PACK_3_CREDITS: '150', MAKETOU_PACK_3_PRICE: '15000' });
  res = loadMaketouCatalog();
  assert.deepEqual(res.catalog, {
    appUrl: 'https://geslead.africa',
    currency: 'XOF',
    packs: [
      { key: 'pack_1', credits: 15, price: 2000, productId: PRODUCT },
      { key: 'pack_3', credits: 150, price: 15000, productId: 'abc' },
    ],
  });
  // Un id qui n'est pas un UUID : averti, pas bloqué
  assert.equal(res.warnings.length, 1);

  setPacks({});
  assert.ok(loadMaketouCatalog().problems.some((p) => p.startsWith('Aucun pack')));
});

test('APP_URL : localhost refusé (Maketou le rejette), localtest.me et tunnel acceptés', () => {
  assert.match(maketouAppUrlProblem('http://localhost:3000') ?? '', /localhost/);
  assert.ok(maketouAppUrlProblem('http://127.0.0.1:3000'));
  assert.ok(maketouAppUrlProblem('https://geslead.africa/app'));
  assert.equal(maketouAppUrlProblem('http://localtest.me:3000'), null);
  assert.equal(maketouAppUrlProblem('https://abcd.ngrok-free.app'), null);
});

// ---------- Synchronisation d'un paiement ----------

const HOUR = 3600_000;
const row = (overrides: Partial<MaketouPaymentRow> = {}): MaketouPaymentRow => ({
  id: 'p-1',
  payer_id: 'u-1',
  status: 'pending',
  provider_transaction_id: CART,
  created_at: new Date(Date.now() - HOUR).toISOString(),
  ...overrides,
});
const cartBody = (status: string, meta: Record<string, string> = { userId: 'u-1', paymentId: 'p-1' }) =>
  jsonResponse(200, { id: CART, status, paymentId: 'pay_1', meta });

// Base simulée : complete() ne crédite qu'une fois, comme la transition gardée de complete_credit_payment()
function syncDeps() {
  const log: string[] = [];
  let granted = false;
  const deps: SyncDeps = {
    complete: async (id, providerPaymentId) => {
      log.push(`complete:${id}:${providerPaymentId}`);
      if (granted) return false;
      granted = true;
      return true;
    },
    recordStatus: async (id, status, close) => {
      log.push(`record:${id}:${status}:${close}`);
    },
    log: () => {},
  };
  return { deps, log };
}

test('sync : completed → crédité une fois ; rejoué → already_completed', async () => {
  const { deps, log } = syncDeps();
  mockFetch([cartBody('completed'), cartBody('completed')]);
  assert.equal((await syncPayment(row(), 8000, deps)).kind, 'granted');
  assert.equal((await syncPayment(row(), 8000, deps)).kind, 'already_completed');
  assert.deepEqual(log, ['complete:p-1:pay_1', 'complete:p-1:pay_1']);
});

test('sync : ligne déjà complétée → aucun appel à Maketou', async () => {
  const { deps } = syncDeps();
  mockFetch([]);
  assert.equal((await syncPayment(row({ status: 'completed' }), 8000, deps)).kind, 'already_completed');
  assert.equal(calls.length, 0);
});

test("sync : statut inconnu ou panier d'un autre compte → jamais crédité", async () => {
  const { deps, log } = syncDeps();
  mockFetch([jsonResponse(200, { id: CART, status: 'paid', meta: { userId: 'u-1' } })]);
  assert.deepEqual(await syncPayment(row(), 8000, deps), { kind: 'error', code: 'UNKNOWN_CART_STATUS', httpStatus: null, quota: { remaining: null, limit: null } });
  mockFetch([cartBody('completed', { userId: 'u-2', paymentId: 'p-1' })]);
  assert.equal(((await syncPayment(row(), 8000, deps)) as any).code, 'CART_USER_MISMATCH');
  mockFetch([cartBody('completed', { userId: 'u-1', paymentId: 'p-9' })]);
  assert.equal(((await syncPayment(row(), 8000, deps)) as any).code, 'CART_USER_MISMATCH');
  assert.deepEqual(log, []);
});

test('sync : ids comparés en chaînes (id numérique côté base)', async () => {
  const { deps } = syncDeps();
  mockFetch([cartBody('completed', { userId: '42', paymentId: '7' })]);
  const numericRow = { ...row(), id: 7 as unknown as string, payer_id: 42 as unknown as string };
  assert.equal((await syncPayment(numericRow, 8000, deps)).kind, 'granted');
});

test('sync : en attente avant 48 h, clos après (payment_failed → failed, sinon expired)', async () => {
  const { deps, log } = syncDeps();
  mockFetch([cartBody('payment_failed'), cartBody('payment_failed'), cartBody('waiting_payment')]);
  assert.deepEqual(await syncPayment(row(), 8000, deps), { kind: 'pending', providerStatus: 'payment_failed', quota: { remaining: null, limit: null } });
  const old = row({ created_at: new Date(Date.now() - 49 * HOUR).toISOString() });
  assert.equal((await syncPayment(old, 8000, deps)).kind, 'closed');
  assert.equal((await syncPayment(old, 8000, deps)).kind, 'closed');
  assert.deepEqual(log, ['record:p-1:payment_failed:null', 'record:p-1:payment_failed:failed', 'record:p-1:waiting_payment:expired']);
});

test('sync : 429 → rate_limited avec Retry-After, rien enregistré', async () => {
  const { deps, log } = syncDeps();
  mockFetch([jsonResponse(429, {}, { 'Retry-After': '12' })]);
  assert.deepEqual(await syncPayment(row(), 8000, deps), { kind: 'rate_limited', retryAfterSec: 12, quota: null });
  assert.deepEqual(log, []);
});

// ---------- Job de rattrapage ----------

const ok = (kind: 'granted' | 'already_completed' = 'granted', remaining: number | null = 500): SyncResult => ({ kind, quota: { remaining, limit: 600 } });
const err = (code: string): SyncResult => ({ kind: 'error', code, httpStatus: null, quota: null });

function jobDeps(rows: MaketouPaymentRow[], results: Array<SyncResult | Error>, overrides: Partial<ReconcileDeps> = {}) {
  const synced: string[] = [];
  const expired: string[] = [];
  let clock = Date.now();
  const deps: ReconcileDeps = {
    listDue: async () => rows,
    claim: async () => true,
    sync: async (r) => {
      synced.push(r.id);
      const next = results.shift();
      if (!next) throw new Error('sync inattendu');
      if (next instanceof Error) throw next;
      return next;
    },
    expire: async (id) => {
      expired.push(id);
    },
    log: () => {},
    now: () => (clock += 10),
    ...overrides,
  };
  return { deps, synced, expired };
}
const rows = (n: number, ageMs = HOUR) =>
  Array.from({ length: n }, (_, i) => row({ id: `p-${i + 1}`, created_at: new Date(Date.now() - ageMs).toISOString() }));
const opts = { budgetMs: 45_000, callTimeoutMs: 15_000 };

test('job : traite tout et compte les octrois', async () => {
  const { deps, synced } = jobDeps(rows(3), [ok(), ok('already_completed'), { kind: 'pending', providerStatus: 'waiting_payment', quota: null }]);
  const summary = await reconcile(deps, opts);
  assert.deepEqual(summary, { checked: 3, granted: 1, closed: 0, expired: 0, stopReason: 'done' });
  assert.equal(synced.length, 3);
});

test('job : s arrête sur 429, sur quota bas et sur erreur de configuration', async () => {
  let job = jobDeps(rows(3), [{ kind: 'rate_limited', retryAfterSec: 5, quota: null }]);
  assert.equal((await reconcile(job.deps, opts)).stopReason, 'rate_limited');
  assert.equal(job.synced.length, 1);

  job = jobDeps(rows(3), [ok('granted', 59)]);
  assert.equal((await reconcile(job.deps, opts)).stopReason, 'low_quota');
  assert.equal(job.synced.length, 1);

  job = jobDeps(rows(3), [err('INVALID_API_KEY')]);
  assert.equal((await reconcile(job.deps, opts)).stopReason, 'config');
  assert.equal(job.synced.length, 1);
});

test('job : s arrête après 3 pannes de suite ; un succès remet le compteur à zéro', async () => {
  let job = jobDeps(rows(5), [err('NETWORK_ERROR'), err('HTTP_502'), err('MALFORMED_RESPONSE')]);
  assert.equal((await reconcile(job.deps, opts)).stopReason, 'outage');
  assert.equal(job.synced.length, 3);

  job = jobDeps(rows(5), [err('NETWORK_ERROR'), err('HTTP_502'), ok(), err('NETWORK_ERROR'), err('HTTP_500')]);
  assert.equal((await reconcile(job.deps, opts)).stopReason, 'done');
  assert.equal(job.synced.length, 5);
});

test('job : une ligne qui plante ne bloque pas les suivantes', async () => {
  let calls = 0;
  const job = jobDeps(rows(3), [ok(), ok()], {
    claim: async () => {
      if (++calls === 1) throw new Error('base indisponible');
      return true;
    },
  });
  const summary = await reconcile(job.deps, opts);
  assert.equal(summary.stopReason, 'done');
  assert.equal(summary.granted, 2);
  assert.deepEqual(job.synced, ['p-2', 'p-3']);
});

test('job : créneau déjà pris par une page de retour → ligne sautée sans appel', async () => {
  const job = jobDeps(rows(2), [ok()], { claim: async (id) => id !== 'p-1' });
  await reconcile(job.deps, opts);
  assert.deepEqual(job.synced, ['p-2']);
});

test('job : erreur propre au panier close la ligne seulement après 72 h ; une panne jamais', async () => {
  let job = jobDeps(rows(2, 10 * HOUR), [err('CART_NOT_FOUND'), err('CART_USER_MISMATCH')]);
  await reconcile(job.deps, opts);
  assert.deepEqual(job.expired, []);

  job = jobDeps(rows(3, 80 * HOUR), [err('CART_NOT_FOUND'), err('UNKNOWN_CART_STATUS'), err('HTTP_503')]);
  const summary = await reconcile(job.deps, opts);
  assert.deepEqual(job.expired, ['p-1', 'p-2']);
  assert.equal(summary.expired, 2);
});

test('job : un 200 HTML pendant une panne ne clôt jamais un vieux panier (chaîne complète)', async () => {
  const { deps: sync } = syncDeps();
  const old = rows(1, 80 * HOUR);
  mockFetch([new Response('<html>502 Bad Gateway</html>', { status: 200 })]);
  const job = jobDeps(old, [], { sync: (r) => syncPayment(r, 15_000, sync) });
  const summary = await reconcile(job.deps, opts);
  assert.deepEqual(job.expired, []);
  assert.equal(summary.checked, 1);
});

test('job : budget respecté (pas de nouvel appel qui dépasserait la limite)', async () => {
  let clock = 0;
  const job = jobDeps(rows(10), Array.from({ length: 10 }, () => ok()), { now: () => (clock += 10_000) });
  const summary = await reconcile(job.deps, opts);
  assert.equal(summary.stopReason, 'budget');
  assert.ok(job.synced.length < 10);
});
