// Vérification de la configuration Maketou, sans paiement : npm run check:maketou
// Lit supabase/functions/.env (secrets des Edge Functions) et .env (URL du projet + clé service, pour le heartbeat du job).
// Affiche réussite / échec par contrôle, jamais la valeur d'un secret.
import { createCart, MaketouError, maketouApiKeyProblem } from '../supabase/functions/_shared/maketou.ts';
import { loadMaketouCatalog, MAKETOU_RETURN_PATH } from '../supabase/functions/_shared/maketou-catalog.ts';
import { readEnv } from '../supabase/functions/_shared/env.ts';

let failures = 0;
const pass = (label: string) => console.log(`  ✔ ${label}`);
const fail = (label: string) => {
  failures++;
  console.log(`  ✘ ${label}`);
};
const note = (label: string) => console.log(`  · ${label}`);

// 1. Variables
console.log('\n1. Configuration (supabase/functions/.env)');
const keyProblem = maketouApiKeyProblem();
if (keyProblem) fail(keyProblem);
else pass('MAKETOU_API_KEY présente et bien formée');
const { catalog, problems, warnings } = loadMaketouCatalog();
problems.forEach(fail);
warnings.forEach((w) => note(w));
if (catalog) {
  pass(`APP_URL valide, devise ${catalog.currency}`);
  for (const p of catalog.packs) note(`${p.key} : ${p.credits} crédits à ${p.price} ${catalog.currency} (doit être le prix du produit dans Maketou)`);
}

// 2. Clé + forme de la requête : un email volontairement invalide, donc aucun panier créé
console.log('\n2. Clé API et adresse de retour, sans créer de panier');
if (keyProblem || !catalog) {
  note('ignoré : corriger la configuration d’abord');
} else {
  try {
    await createCart({
      productDocumentId: catalog.packs[0].productId,
      redirectUrl: `${catalog.appUrl}${MAKETOU_RETURN_PATH}`,
      meta: {},
      customer: { email: 'pas-un-email', firstName: 'Test', lastName: '-' },
    });
    fail('Maketou a accepté un email invalide : réponse inattendue');
  } catch (e) {
    const err = e instanceof MaketouError ? e : new MaketouError('NETWORK_ERROR', String(e));
    if (err.code === 'INVALID_API_KEY') fail('Clé API refusée par Maketou (401) : recopier la clé (Autres → Clés API)');
    else if (err.fields.includes('redirectURL')) fail(`Adresse de retour refusée par Maketou : vérifier APP_URL`);
    else if (err.fields.includes('email')) {
      pass('Clé API acceptée, adresse de retour acceptée');
      const others = err.fields.filter((f) => f !== 'email');
      if (others.length) note(`autres champs signalés : ${others.join(', ')}`);
    } else if (err.code === 'VALIDATION_ERROR') pass('Clé API acceptée (validation sans détail des champs)');
    else if (err.code === 'INVALID_PRODUCT') fail('Produit introuvable : id faux, produit non publié ou d’une autre boutique');
    else fail(`Réponse inattendue de Maketou : ${err.code}`);
  }
}
note('les produits à prix fixe ne se vérifient pas sans créer de panier : contrôler leur prix lors du premier vrai paiement');

// 3. La page de retour doit servir l'application, pas une 404 de l'hébergeur
console.log('\n3. Page de retour');
if (!catalog) {
  note('ignoré : APP_URL invalide');
} else {
  const url = `${catalog.appUrl}${MAKETOU_RETURN_PATH}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const html = await res.text();
    if (res.ok && html.includes('name="maketou-return"')) pass(`${url} sert l'application`);
    else fail(`${url} répond ${res.status} sans l'application : activer la réécriture SPA de l'hébergeur`);
  } catch {
    fail(`${url} injoignable (site déployé ? tunnel lancé ?)`);
  }
}

// 4. Heartbeat du job de rattrapage (table job_leases, lue avec la clé service)
console.log('\n4. Job de rattrapage (toutes les 5 min)');
const supabaseUrl = (readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL'))?.trim().replace(/\/+$/, '');
const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY')?.trim();
if (!supabaseUrl || !serviceKey) {
  note('ignoré : SUPABASE_URL (ou VITE_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY absentes de .env');
} else {
  try {
    const headers: Record<string, string> = { apikey: serviceKey };
    if (!serviceKey.startsWith('sb_')) headers.Authorization = `Bearer ${serviceKey}`;
    const res = await fetch(
      `${supabaseUrl}/rest/v1/job_leases?name=eq.maketou-reconcile&select=last_run_at,last_stop_reason`,
      { headers, signal: AbortSignal.timeout(10_000) },
    );
    const rows = res.ok ? await res.json() : null;
    if (!res.ok) fail(`lecture impossible (HTTP ${res.status}) : migration 0004 appliquée ?`);
    else if (!rows?.[0]?.last_run_at) fail("le job n'a encore jamais tourné : fonction maketou-reconcile déployée ?");
    else {
      const minutes = Math.round((Date.now() - Date.parse(rows[0].last_run_at)) / 60_000);
      const reason = rows[0].last_stop_reason;
      if (minutes > 15) fail(`dernier passage il y a ${minutes} min : le job ne tourne plus (pg_cron, fonction)`);
      else pass(`dernier passage il y a ${minutes} min, arrêt : ${reason}`);
      if (reason === 'config' || reason === 'crash' || reason === 'outage') {
        note('voir les logs de maketou-reconcile dans le dashboard Supabase');
      }
    }
  } catch {
    fail('Supabase injoignable');
  }
}

console.log(failures ? `\n${failures} problème(s) à corriger.\n` : '\nTout est en ordre.\n');
process.exitCode = failures ? 1 : 0;
