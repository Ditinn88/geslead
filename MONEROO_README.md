# Mise en service : crédits + paiement Moneroo

**Ce que fait l'intégration :**
- Chaque compte reçoit **5 crédits offerts** (nouveaux comptes et comptes existants).
- Chaque génération de leads **consomme 3 crédits**, débités côté serveur.
- Les crédits s'achètent par packs via **Moneroo** (Mobile Money et carte), sur la page de paiement hébergée par Moneroo.
- Les crédits ne sont ajoutés qu'après confirmation par Moneroo : webhook signé, puis vérification auprès de l'API Moneroo.

> **État : NON VÉRIFIÉ EN CONDITIONS RÉELLES.** Le build du site et les 13 tests automatiques passent (`npm run test:moneroo`). En revanche, les migrations et les Edge Functions n'ont pas encore été déployées ni testées avec un vrai paiement.

---

## 1. Côté Moneroo (dashboard)

1. Ouvrir **app.moneroo.io → Developers → API keys** et copier la **clé secrète**. Commencer en **mode test** (bascule en haut à droite) : la clé de test et la clé live sont différentes.
2. Ouvrir **Developers → Webhooks** et ajouter cette URL :
   ```
   https://mlshntuonyoylpilivay.supabase.co/functions/v1/moneroo-webhook
   ```
   Puis copier le **secret de signature** du webhook.

## 2. Côté Supabase

Toutes les commandes se lancent depuis le dossier du projet (`npx` télécharge la CLI Supabase la première fois).

```bash
# Connexion et liaison au projet (une seule fois)
npx supabase login
npx supabase link --project-ref mlshntuonyoylpilivay
#  → si la CLI réclame supabase/config.toml : npx supabase init, puis relancer link

# Tables, crédits et fonctions SQL
npx supabase db push
```

Les migrations appliquées sont :
- `0001_init.sql` : le schéma de base, s'il n'est pas déjà en place.
- `0002_credits_moneroo.sql` : les crédits, la table `payments`, le dédoublonnage des webhooks et les fonctions d'octroi.
- `0003_payments_housekeeping.sql` : un nettoyage quotidien.

Ensuite, les secrets et le déploiement des fonctions :

```bash
# 1. Copier le modèle et le remplir (clés Moneroo, APP_URL, packs et prix)
copy supabase\functions\.env.example supabase\functions\.env

# 2. Envoyer les secrets
npx supabase secrets set --env-file supabase/functions/.env

# 3. Déployer les 3 fonctions (--no-verify-jwt : Moneroo n'envoie pas de jeton,
#    et les fonctions vérifient elles-mêmes l'utilisateur)
npx supabase functions deploy moneroo-checkout --no-verify-jwt
npx supabase functions deploy moneroo-webhook --no-verify-jwt
npx supabase functions deploy moneroo-verify --no-verify-jwt
```

Après modification des secrets, inutile de redéployer : ils s'appliquent immédiatement.

## 3. Côté hébergement du site

Après le paiement, Moneroo renvoie l'acheteur vers `APP_URL/billing/moneroo/return`. Cette adresse doit afficher l'application, et non une page 404 :
- **En local** (`npm run dev`) : rien à faire.
- **En production** : activer la réécriture « SPA » de l'hébergeur, qui sert `index.html` pour toutes les routes. Sur Vercel, c'est automatique avec le preset Vite. Sur Netlify, il faut un fichier `public/_redirects` contenant `/*  /index.html  200`.

## 4. Tester (mode test Moneroo)

1. Se connecter avec un **vrai compte**. Le compte « Démo » n'a pas d'identifiant Supabase et ne peut pas acheter.
2. Cliquer sur le solde de crédits, ou sur « Acheter des crédits », puis choisir un pack.
3. Payer sur la page Moneroo :
   - carte `4242 4242 4242 4242` : paiement accepté ;
   - carte `4000 0000 0000 0002` : paiement refusé ;
   - Mobile Money : n'importe quel numéro, avec le code OTP `123456`.
4. Vérifier que :
   - la page de retour affiche « Paiement confirmé » et le nouveau solde ;
   - la table `payments` passe à `completed`, avec une seule ligne `purchase` dans `credit_ledger`.
5. Rejouer le webhook depuis le dashboard Moneroo : le solde ne doit pas bouger, car le dédoublonnage s'applique.
6. Passer en **clé live**, puis faire un vrai paiement du plus petit pack et vérifier le montant dans le dashboard Moneroo.

## Où est le code

| Rôle | Fichier |
|---|---|
| Crédits, paiements, octroi unique | `supabase/migrations/0002_credits_moneroo.sql` |
| Adaptateur Moneroo (API, signature, événements) | `supabase/functions/_shared/moneroo.ts` |
| Catalogue des packs (variables d'environnement) | `supabase/functions/_shared/catalog.ts` |
| Contrôle du montant et octroi | `supabase/functions/_shared/settle.ts` |
| Création du paiement / webhook / vérification au retour | `supabase/functions/moneroo-checkout`, `moneroo-webhook`, `moneroo-verify` |
| Interface | `src/components/BuyCreditsModal.jsx`, `PaymentReturnView.jsx`, `CreditPricingCards.jsx` |
| Appels depuis le navigateur | `src/lib/billing/credits.ts`, `src/lib/billing/moneroo.ts` |

**Remboursements** : Moneroo n'en propose pas via l'API utilisée ici. Ils se font depuis le dashboard Moneroo ; il faut ensuite passer la ligne `payments` à `refunded`.
