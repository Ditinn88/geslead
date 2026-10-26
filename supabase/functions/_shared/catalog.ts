// Catalogue des packs de crédits : décrit côté serveur, jamais par la requête du navigateur.
// Un pack = 2 variables : MONEROO_PACK_<N>_CREDITS (crédits accordés) et MONEROO_PACK_<N>_PRICE (prix entier).
import { readEnv } from './env.ts';

export const MAX_PACKS = 5;
export const RETURN_PATH = '/billing/moneroo/return';

export type Pack = { key: string; credits: number; price: number };
export type Catalog = { appUrl: string; currency: string; packs: Pack[] };

export const positiveInt = (raw: string | undefined) => {
  const v = raw?.trim();
  return v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null;
};

// APP_URL : origine publique du site (https://domaine.com, sans chemin ni / final)
export function appUrlProblem(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return 'APP_URL manquante';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return 'APP_URL invalide (attendu : https://votre-domaine.com)';
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'APP_URL doit commencer par https://';
  if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
    return 'APP_URL ne doit contenir ni chemin ni paramètres';
  }
  return null;
}

// Les problèmes citent le nom des variables, jamais leurs valeurs
export function loadCatalog(): { catalog: Catalog | null; problems: string[] } {
  const problems: string[] = [];

  const appUrlRaw = readEnv('APP_URL');
  const appProblem = appUrlProblem(appUrlRaw);
  if (appProblem) problems.push(appProblem);

  const currency = (readEnv('MONEROO_CURRENCY')?.trim() || 'XOF').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) problems.push('MONEROO_CURRENCY invalide (ex. XOF, XAF)');

  const packs: Pack[] = [];
  for (let n = 1; n <= MAX_PACKS; n++) {
    const creditsRaw = readEnv(`MONEROO_PACK_${n}_CREDITS`);
    const priceRaw = readEnv(`MONEROO_PACK_${n}_PRICE`);
    if (!creditsRaw?.trim() && !priceRaw?.trim()) continue;
    const credits = positiveInt(creditsRaw);
    const price = positiveInt(priceRaw);
    if (credits === null) problems.push(`MONEROO_PACK_${n}_CREDITS manquante ou pas un entier positif`);
    if (price === null) problems.push(`MONEROO_PACK_${n}_PRICE manquante ou pas un entier positif`);
    if (credits !== null && price !== null) packs.push({ key: `pack_${n}`, credits, price });
  }
  if (!packs.length && !problems.some((p) => p.startsWith('MONEROO_PACK_'))) {
    problems.push('Aucun pack configuré (MONEROO_PACK_1_CREDITS et MONEROO_PACK_1_PRICE)');
  }

  if (problems.length) return { catalog: null, problems };
  return { catalog: { appUrl: appUrlRaw!.trim().replace(/\/+$/, ''), currency, packs }, problems };
}
