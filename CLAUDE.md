# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

GESLEAD : outil de prospection B2B pour l'Afrique (secteur + ville → entreprises Google Maps → messages de prospection IA → export CSV). Interface, commentaires et textes en français.

**Attention, le plan et le code divergent.** [PLAN_IMPLEMENTATION.md](PLAN_IMPLEMENTATION.md) décrit la cible : Next.js 14, Route Handlers côté serveur, Apify asynchrone + webhook, API Claude en streaming. Le code réel est une **SPA Vite + React 18**, surtout un prototype front-end avec des données simulées. Le seul backend est la partie crédits/paiement, en **Supabase Edge Functions** (voir « Crédits et paiement »). Avant d'implémenter une fonctionnalité du plan, vérifier ce qui existe vraiment dans `src/` et `supabase/`.

## Commandes

```bash
npm install
npm run dev       # Vite sur http://localhost:3000 (host: true)
npm run build     # build de production dans dist/
npm run preview   # sert le build
npm run test:maketou   # tests node:test du code partagé Maketou (client API, catalogue, synchronisation, job)
npm run test:moneroo   # tests node:test du code partagé Moneroo (adaptateur, catalogue, octroi)
npm run check:maketou  # vérifie la vraie configuration Maketou sans payer (lit supabase/functions/.env et .env)
```

Il n'y a ni linter, ni vérification de types : pas de `typescript`, pas de `tsconfig.json`. Vite/esbuild transpile les `.ts` sans contrôler les types, donc une erreur de type ne casse pas le build, mais un import manquant le casse. Les tests tournent sous Node 24 (TypeScript exécuté directement) : le code de `supabase/functions/_shared/` testé doit rester sans API Deno (variables lues via `readEnv` de `env.ts`) et sans syntaxe TS non effaçable (enums, propriétés de paramètres).

## Architecture

- **Point d'entrée** : `index.html` (polices Google, overlay de bruit SVG, boîte d'erreurs JS de debug) → `src/main.jsx` (ErrorBoundary) → `src/App.jsx`.
- **`App.jsx` est monolithique (~2200 lignes)** : landing page complète, tout l'état de l'application, et les modales (auth, Supabase, Apify, vidéo). Il n'y a pas de routeur : la navigation passe par l'état `currentView` (`'landing' | 'dashboard' | 'leads'`), persisté dans `localStorage`. `DashboardView`, `WorkspaceModal` (utilisé comme page avec `isPage`, ou comme modale de démo) et `NewSearchModal` sont des composants contrôlés qui reçoivent tout leur état et leurs callbacks d'`App.jsx`.
- **Les recherches sont simulées** : `generateLeadsForSearch()` dans `App.jsx` fabrique des leads (noms, numéros mobiles aléatoires selon le pays) avec de fausses étapes de progression (`setTimeout`). Apify n'est jamais appelé depuis l'UI. L'historique est dans `localStorage` (`geslead_searches_history`) et les crédits ne sont qu'un état local. Les données de démo sont dans `src/lib/mockData.ts`.
- **IA** : `src/lib/ai/openai.ts` appelle OpenAI (`gpt-4o-mini`) **depuis le navigateur** avec `VITE_OPENAI_API_KEY`, avec un timeout de 4,5 s. Sans clé ou en cas d'erreur, il bascule sur `generateLocalSampleMessage()` (moteur de modèles dans `src/lib/ai/prompts.ts`). Le « streaming » affiché est un effet machine à écrire côté client. Le plan prévoit Claude côté serveur.
- **Supabase** (`src/lib/supabase/client.ts`) : client navigateur, utilisé uniquement pour l'auth (`signUp`, `signInWithPassword`, `getSession`). `supabase` peut valoir `null` : l'app a alors un mode démo sans auth. URL et clé publishable du projet `mlshntuonyoylpilivay` sont codées en dur en secours. La modale Supabase peut stocker URL et clé dans `localStorage`.
- **Modules écrits pour le plan mais non branchés** : `lib/apify/start-search.ts`, `ingest-run.ts`, `normalize.ts`, `lib/validations.ts`, `lib/geo.ts`, `types/database.ts`. Ils ne fonctionnent pas en l'état :
  - `ingest-run.ts` appelle `apify.run()` et `apify.dataset()`, que le client REST maison de `lib/apify/client.ts` n'implémente pas (seulement `actor().start()` et `user().get()`) ;
  - `validations.ts` importe `zod`, qui n'est pas dans `package.json` : l'importer casse le build ;
  - ces modules écrivent avec le client anonyme, ce que la RLS interdit (voir ci-dessous).
- **CSV** (`src/lib/csv/to-csv.ts`) : séparateur `;` (Excel FR), BOM UTF-8, protection contre l'injection de formules. Le flag `trusted` d'une colonne désactive cette protection : ne l'utiliser que pour des valeurs validées.
- **Alias** : `@` → `src/` (`vite.config.js`).

## Crédits et paiement

Guides de mise en service : [MAKETOU_README.md](MAKETOU_README.md) (paiement actif) et [MONEROO_README.md](MONEROO_README.md). Skills suivis : `src/lib/COMMENT INT SAAS/COMMENT PAYER SAAS.docx` (Maketou) et `src/lib/izisaas mobile money skills/` (Moneroo).

- **Crédits** : colonne `profiles.credits` (5 par défaut, y compris pour les comptes existants). Une génération de leads coûte 3 crédits, débités par la RPC `spend_search_credits()` (`security definer`). Le coût est dans la fonction SQL ; `SEARCH_CREDIT_COST` dans `src/lib/billing/credits.ts` ne sert qu'à l'affichage. Pour le compte démo (sans `id`), le solde reste local (`hasRealAccount`).
- **Maketou est le seul achat branché à l'interface** : `BuyCreditsModal` et `CreditPricingCards` importent `lib/billing/maketou`. Le code Moneroo est conservé, mais aucun bouton n'y mène ; sa page de retour reste routée.
- **Octroi des crédits** : `complete_credit_payment()` et `fail_credit_payment()` (SQL, réservées à `service_role`, communes aux deux prestataires) sont le seul chemin vers les crédits achetés. La transition est gardée par le statut, et `credit_ledger.payment_id` est unique, ce qui garantit un seul octroi par paiement.
- **Edge Functions** : à déployer avec `--no-verify-jwt`, car elles authentifient elles-mêmes l'utilisateur via `getUser()` (ou le secret du job). La clé admin est lue dans `SUPABASE_SECRET_KEYS` (repli sur `SUPABASE_SERVICE_ROLE_KEY`). Le retour du navigateur ne prouve jamais un paiement.

### Maketou (actif)

Maketou n'a **pas de webhook** et le panier ne contient **pas le montant**.
- **Achat** : `maketou-checkout` ouvre une ligne `payments` (`provider = 'maketou'`, prix et crédits en instantané) par la RPC `open_credit_payment()`, qui plafonne atomiquement les achats ouverts par heure. Il crée ensuite le panier, avec nos ids dans `meta`, et range son id dans `provider_transaction_id`.
- **Packs** : un pack = un produit Maketou à **prix fixe** (`MAKETOU_PACK_<N>_PRODUCT_ID/_CREDITS/_PRICE`). Le prix des variables doit être celui du dashboard Maketou : rien ne le vérifie automatiquement.
- **Preuve de paiement** : seulement un `GET` du panier côté serveur qui renvoie `status = 'completed'`. `syncPayment()` (`_shared/maketou-sync.ts`) est le seul code qui lit ce statut. Il est appelé par :
  - `maketou-confirm`, depuis la page de retour `/billing/maketou/return` (vue `maketou-return`, `MaketouReturnView`) ;
  - `maketou-reconcile`, lancé toutes les 5 min par pg_cron via pg_net. Il s'authentifie par un secret généré dans le Vault (`verify_maketou_job_secret`) et tient un bail avec heartbeat dans `job_leases`.
- **Quota Maketou** (lecture de statut limitée par clé, partagée par tous) : `claim_payment_check()` impose 4 s entre deux interrogations, par acheteur et par panier. Quand Maketou n'a pas été interrogé, la confirmation répond `checking`, jamais le statut stocké.
- **Clôture** : un panier non payé est clos par le job après 48 h. L'entretien quotidien, replanifié dans `0004`, ne touche plus aux paniers Maketou.
- **APP_URL** ne peut pas être `localhost` (Maketou la refuse). En local, utiliser `http://localtest.me:3000` (autorisé dans `vite.config.js`).

### Moneroo (en réserve)

- `moneroo-checkout` insère une ligne `payments` en `pending` **avant** d'appeler Moneroo, avec notre id dans `metadata.paymentId`. Le prix vient du catalogue serveur (`MONEROO_PACK_<N>_CREDITS/_PRICE`).
- `moneroo-webhook` vérifie `X-Moneroo-Signature` (HMAC du corps **brut**), dédoublonne (`processed_events`), ré-interroge l'API Moneroo, contrôle montant et devise, puis appelle `complete_credit_payment()`.
- Page de retour : `/billing/moneroo/return?ref=<id>`, vue `billing-return` (`PaymentReturnView`). Le paramètre s'appelle `ref`, parce que Moneroo ajoute son propre `paymentId` à l'URL. Si le webhook tarde, la page appelle `moneroo-verify`.

## Base de données (Supabase)

Le schéma est dans `supabase/migrations/0001_init.sql` : `profiles` (crédits, créé par trigger à l'inscription), `searches`, `leads` (unique `user_id, place_id`), `search_leads`, `messages`, et la vue `leads_by_search`.

La RLS est conçue pour un backend avec la clé `service_role` :
- côté client, `searches` est en lecture seule ;
- sur `profiles`, l'utilisateur ne peut modifier que ses informations, jamais `plan` ni les crédits (droits par colonne posés dans `0002`) ;
- sur `leads`, seules `status` et `notes` sont modifiables ;
- le débit de crédits passe par la RPC `consume_credits` ;
- `refund_credits` est réservée au serveur.

**Créer des recherches ou insérer des leads est donc impossible depuis la SPA** : il faut un backend (Edge Function Supabase ou serveur) avant de brancher Apify pour de vrai.

## Variables d'environnement

Vite n'expose au navigateur que les variables `VITE_*`. Le code lit d'abord `VITE_*`, puis `NEXT_PUBLIC_*` en secours, pour rester compatible avec le plan. **Toute variable `VITE_*` se retrouve en clair dans le bundle JS.** C'est le cas aujourd'hui de `VITE_OPENAI_API_KEY` et `VITE_APIFY_TOKEN`, et `lib/apify/client.ts` contient en plus un jeton Apify de secours codé en dur. Les secrets (OpenAI, Apify, service role) doivent passer côté serveur. Modèle de fichier : `.env.example`.

## Design

- **Tokens Tailwind** (`tailwind.config.js`) : `mousse` (vert), `argile` (terracotta `#CC5833`, accent), `creme` (fonds), `charbon` (texte).
- **Polices** : Plus Jakarta Sans (sans), Cormorant Garamond (serif), IBM Plex Mono (mono), chargées dans `index.html`.
- **Animations** : GSAP + ScrollTrigger, dans un `gsap.context` de `App.jsx` (nettoyé par `ctx.revert()`).
