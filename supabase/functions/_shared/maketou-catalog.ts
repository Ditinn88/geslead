// Catalogue des packs de crédits vendus via Maketou : décrit côté serveur, jamais par la requête du navigateur.
// Un pack = un produit Maketou à prix fixe et 3 variables :
//   MAKETOU_PACK_<N>_PRODUCT_ID (Produit → Partager → Identifiant public du produit)
//   MAKETOU_PACK_<N>_CREDITS    (crédits accordés)
//   MAKETOU_PACK_<N>_PRICE      (notre instantané du prix : il DOIT être égal au prix du produit dans Maketou)
import { readEnv } from './env.ts';
import { appUrlProblem, MAX_PACKS, positiveInt } from './catalog.ts';
import { UUID_RE } from './maketou.ts';

export const MAKETOU_RETURN_PATH = '/billing/maketou/return';

export type MaketouPack = { key: string; credits: number; price: number; productId: string };
export type MaketouCatalog = { appUrl: string; currency: string; packs: MaketouPack[] };

// Maketou refuse localhost et 127.0.0.1 comme adresse de retour, même pour un test local
export function maketouAppUrlProblem(raw: string | undefined): string | null {
  const problem = appUrlProblem(raw);
  if (problem) return problem;
  const host = new URL(raw!.trim()).hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '[::1]') {
    return 'APP_URL ne peut pas être localhost avec Maketou (utiliser un tunnel ou http://localtest.me:3000)';
  }
  return null;
}

// Problèmes bloquants et avertissements citent le nom des variables, jamais leurs valeurs
export function loadMaketouCatalog(): { catalog: MaketouCatalog | null; problems: string[]; warnings: string[] } {
  const problems: string[] = [];
  const warnings: string[] = [];

  const appUrlRaw = readEnv('APP_URL');
  const appProblem = maketouAppUrlProblem(appUrlRaw);
  if (appProblem) problems.push(appProblem);

  // Devise du produit Maketou (l'API n'a pas de champ devise)
  const currency = (readEnv('MAKETOU_CURRENCY')?.trim() || 'XOF').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) problems.push('MAKETOU_CURRENCY invalide (ex. XOF, XAF)');

  const packs: MaketouPack[] = [];
  for (let n = 1; n <= MAX_PACKS; n++) {
    const prefix = `MAKETOU_PACK_${n}`;
    const productId = readEnv(`${prefix}_PRODUCT_ID`)?.trim();
    const creditsRaw = readEnv(`${prefix}_CREDITS`);
    const priceRaw = readEnv(`${prefix}_PRICE`);
    if (!productId && !creditsRaw?.trim() && !priceRaw?.trim()) continue;

    const credits = positiveInt(creditsRaw);
    const price = positiveInt(priceRaw);
    if (!productId) problems.push(`${prefix}_PRODUCT_ID manquante`);
    else if (!UUID_RE.test(productId)) warnings.push(`${prefix}_PRODUCT_ID n'a pas la forme d'un UUID : vérifier l'identifiant copié`);
    if (credits === null) problems.push(`${prefix}_CREDITS manquante ou pas un entier positif`);
    if (price === null) problems.push(`${prefix}_PRICE manquante ou pas un entier positif`);
    if (productId && credits !== null && price !== null) packs.push({ key: `pack_${n}`, credits, price, productId });
  }
  if (!packs.length && !problems.some((p) => p.startsWith('MAKETOU_PACK_'))) {
    problems.push('Aucun pack configuré (MAKETOU_PACK_1_PRODUCT_ID, MAKETOU_PACK_1_CREDITS et MAKETOU_PACK_1_PRICE)');
  }

  if (problems.length) return { catalog: null, problems, warnings };
  return { catalog: { appUrl: appUrlRaw!.trim().replace(/\/+$/, ''), currency, packs }, problems, warnings };
}
