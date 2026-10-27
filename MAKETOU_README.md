# Mise en service : achat de crédits avec Maketou

**Ce que fait l'intégration :**
- Chaque compte reçoit **5 crédits offerts** (nouveaux comptes et comptes existants).
- Chaque génération de leads **consomme 3 crédits**, débités côté serveur.
- Les crédits s'achètent par packs avec **Maketou** (Mobile Money et carte), sur la page de paiement hébergée par Maketou.
- Maketou n'envoie aucune notification à GESLEAD. Les crédits sont ajoutés quand notre serveur a lu « payé » chez Maketou :
  - tout de suite, par la page de retour ;
  - au plus tard 5 minutes après, par un job automatique, si l'acheteur a fermé l'onglet.

> **État : NON VÉRIFIÉ EN CONDITIONS RÉELLES.** Les 26 tests automatiques passent (`npm run test:maketou`). La migration SQL a été vérifiée sur un Postgres local : octroi unique, plafond, droits. En revanche, rien n'est encore déployé, et aucun vrai paiement n'a été fait.

**À savoir avant de vendre :**
- Maketou prélève **8 %** sur les paiements créés par l'API.
- Il n'y a **pas de mode test** : chaque paiement est réel. Il faut tester avec un petit montant.
- Il n'y a **pas de remboursement par l'API**. Un remboursement se fait dans le dashboard Maketou (voir la fin du guide).

---

## 1. Côté Maketou (app.maketou.com)

1. Ouvrir la boutique qui encaissera les paiements.
2. Créer **un produit par pack de crédits**, par exemple « GESLEAD — 15 crédits ». Pour chacun :
   - type de tarification : **prix fixe** ;
   - **devise** : celle de `MAKETOU_CURRENCY` (XOF par défaut) ;
   - **prix** : exactement celui de `MAKETOU_PACK_<N>_PRICE` ;
   - puis **publier** le produit.
3. Ouvrir chaque produit → **Partager** → copier l'**Identifiant public du produit**.
4. **Autres** → **Clés API** → **Ajouter une clé API** → copier la clé (elle ne s'affiche qu'une fois).

Rien d'autre à régler chez Maketou : il n'y a ni webhook ni adresse de retour à configurer.

## 2. Côté Supabase

### Migration `0004_maketou.sql`

Les migrations 0001 à 0003 ont été collées à la main dans l'éditeur SQL. Le plus simple est donc de faire pareil :

1. Ouvrir **Supabase → SQL Editor**.
2. Coller tout le contenu de `supabase/migrations/0004_maketou.sql`, puis cliquer sur **Run**.

Pour passer plutôt par la CLI, il faut d'abord déclarer les trois premières migrations, sinon elle les rejoue :

```bash
npx supabase migration repair --status applied 0001 0002 0003
npx supabase db push
```

Ce que fait la migration :
- elle ajoute le suivi des paniers à la table `payments` ;
- elle génère dans le Vault le secret du job (personne n'a à le copier) ;
- elle programme le job toutes les 5 minutes avec pg_cron.

### Secrets et déploiement des fonctions

```bash
# 1. Copier le modèle puis remplir le bloc MAKETOU, APP_URL et les packs
copy supabase\functions\.env.example supabase\functions\.env

# 2. Envoyer les secrets
npx supabase secrets set --env-file supabase/functions/.env

# 3. Déployer les 3 fonctions (--no-verify-jwt : elles vérifient elles-mêmes l'utilisateur ou le secret du job)
npx supabase functions deploy maketou-checkout --no-verify-jwt
npx supabase functions deploy maketou-confirm --no-verify-jwt
npx supabase functions deploy maketou-reconcile --no-verify-jwt
```

Dans `supabase/functions/.env` :
- une valeur par ligne ;
- pas de guillemets ;
- pas de commentaire sur la même ligne que la valeur.

Après une modification des secrets, inutile de redéployer : ils s'appliquent tout de suite.

## 3. Côté hébergement du site

Après le paiement, Maketou renvoie l'acheteur vers `APP_URL/billing/maketou/return`. Cette adresse doit afficher l'application, et non une page 404 :
- **Vercel** : c'est automatique avec le preset Vite.
- **Netlify** : ajouter un fichier `public/_redirects` contenant `/*  /index.html  200`.

## 4. Vérifier la configuration (sans payer)

```bash
npm run check:maketou
```

Le script lit `supabase/functions/.env` et `.env`. Il vérifie :
- les variables ;
- que la clé API est acceptée par Maketou (sans créer de panier) ;
- que la page de retour répond ;
- que le job a tourné il y a moins de 15 minutes.

Il affiche ✔ ou ✘ pour chaque point, sans jamais afficher la valeur d'un secret.

## 5. Premier vrai paiement

1. Mettre provisoirement un petit prix sur le plus petit pack, à la fois dans Maketou et dans `MAKETOU_PACK_1_PRICE`.
2. Se connecter avec un **vrai compte**. Le compte « Démo » ne peut pas acheter.
3. Pour tester en local :
   - Maketou refuse `localhost`. Lancer `npm run dev` et ouvrir **http://localtest.me:3000**, avec `APP_URL=http://localtest.me:3000` dans les secrets.
   - Se connecter sur cette même adresse : sinon on revient du paiement déconnecté.
4. Cliquer sur le solde de crédits, ou sur « Acheter des crédits », puis choisir le pack et payer.
5. Vérifier que :
   - la page Maketou affiche **exactement** le prix annoncé dans GESLEAD, et ne permet pas de le modifier ;
   - elle propose bien Mobile Money et carte, comme annoncé sur le site ;
   - la page de retour affiche « Paiement confirmé » et le nouveau solde ;
   - dans Supabase, la ligne `payments` est `completed`, avec une seule ligne `purchase` dans `credit_ledger` ;
   - le dashboard Maketou indique le même montant.
6. Refaire un achat et **fermer l'onglet** dès le paiement fait : les crédits doivent arriver en moins de 5 minutes, grâce au job.
7. Recharger la page de retour, ou double-cliquer : les crédits ne doivent pas être ajoutés deux fois.
8. Remettre le vrai prix, dans Maketou **et** dans les secrets.

## Où est le code

| Rôle | Fichier |
|---|---|
| Suivi des paniers, plafond, rythme des appels, job planifié | `supabase/migrations/0004_maketou.sql` |
| Octroi unique des crédits (commun avec Moneroo) | `complete_credit_payment()` dans `0002`, mise à jour dans `0004` |
| Client de l'API Maketou | `supabase/functions/_shared/maketou.ts` |
| Catalogue des packs (variables d'environnement) | `supabase/functions/_shared/maketou-catalog.ts` |
| Lecture du statut et job de rattrapage | `supabase/functions/_shared/maketou-sync.ts` |
| Fonctions : création du panier, confirmation, job | `supabase/functions/maketou-checkout`, `maketou-confirm`, `maketou-reconcile` |
| Interface | `src/components/BuyCreditsModal.jsx`, `MaketouReturnView.jsx`, `CreditPricingCards.jsx` |
| Appels depuis le navigateur | `src/lib/billing/maketou.ts` |
| Vérification de la configuration | `scripts/check-maketou.ts` |

## Remboursements

Ils se font dans le dashboard Maketou. Ensuite, dans Supabase :
- passer la ligne `payments` à `refunded`, avec une explication dans `note` ;
- retirer les crédits à la main si besoin.

## Moneroo

L'intégration Moneroo est conservée (`MONEROO_README.md`), mais aucun bouton n'y mène. Pour y revenir, il suffit de faire importer `fetchCreditPacks`, `startCreditCheckout` et `CHECKOUT_ERROR_MESSAGES` depuis `lib/billing/moneroo` au lieu de `lib/billing/maketou`, dans `BuyCreditsModal.jsx` et `CreditPricingCards.jsx`. Sa page de retour est toujours routée.

## 6. Guinée : Paiement direct Orange Money (GNF)

En Guinée (Conakry), **Orange Money** représente la quasi-totalité des paiements Mobile Money. Comme la page Maketou ne propose que MTN MoMo pour la zone Guinée, une option directe **Orange Money Guinée** est intégrée dans GESLEAD :

- **Packs en Francs Guinéens (GNF)** :
  - **Essentiel (15 crédits)** : 10 000 GNF
  - **Performance (45 crédits)** : 75 000 GNF
  - **Entreprise (150 crédits)** : 225 000 GNF
- **Configuration vendeur (dans `.env`)** :
  ```env
  VITE_OM_GUINEA_PHONE="+224 624 XX XX XX"
  VITE_OM_GUINEA_CODE="*144*4*4#"
  VITE_OM_GUINEA_NAME="GESLEAD Guinée"
  VITE_OM_GUINEA_WHATSAPP="+224 624 XX XX XX"
  ```
- **Validation** : Le client saisit sa référence de transaction SMS reçue d'Orange Money ou confirme directement par WhatsApp via le message pré-rempli. Vous pouvez valider les crédits en un clic avec la fonction SQL `select complete_credit_payment('<id_du_paiement>');` ou via le dashboard.

