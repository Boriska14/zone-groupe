# Zone Groupe — boutique d'électronique

Next.js 15 (App Router) · Supabase (Postgres, Auth, Storage) · Vercel · Tailwind.
Palette : `#03045F` `#00B6DA` `#FFCAD4` `#8D9AAE` `#EAEAEA`.

## Fonctions

- Boutique : accueil, catalogue par catégorie, recherche, fiche produit, panier, commande.
- **Négociation** : assistant (bot) ou gérant quand il est « Disponible ».
  - Le **prix plancher** est stocké dans une table séparée (`product_floors`) protégée par RLS : jamais envoyé au navigateur.
  - Le bot descend par paliers (-30 %, -55 %, -75 %, -90 %, -100 % de la marge) et ne peut **jamais** accepter sous le plancher (vérifié côté serveur).
  - L'accord est valable 24 h et **re-vérifié au paiement** (le prix envoyé par le navigateur est ignoré).
  - Le gérant peut reprendre la main, fixer un prix (alerte s'il est sous le plancher), clôturer ou rendre la main au bot.
- **Admin** (`/admin`) : tableau de bord, produits (images, stock, prix, plancher), catégories, commandes (statuts), négociations en direct, disponibilité, paramètres.
- **Paiement mobile money** via un adaptateur d'agrégateur (`src/lib/payment.ts`) + webhook signé.

## Installation locale

```bash
npm install
cp .env.example .env.local     # puis remplir
npm run dev
```

## 1. Supabase

1. Créer un projet Supabase.
2. SQL Editor → coller et exécuter `supabase/schema.sql` (tables, RLS, bucket `products`, catégories de départ).
3. Authentication → Users → **Add user** (email + mot de passe du propriétaire).
4. SQL Editor : `insert into admins (user_id) select id from auth.users where email = 'VOTRE_EMAIL';`
5. Project Settings → API : copier l'URL, la clé `anon` et la clé `service_role`.

## 2. Vercel

1. Pousser le dossier sur GitHub, puis « Import Project » dans Vercel.
2. Variables d'environnement (voir `.env.example`) :
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_SITE_URL`, `PAYMENT_PROVIDER`, `NYOLE_SECRET_KEY`.
3. Déployer. Admin : `https://votre-site/connexion-admin`.

`SUPABASE_SERVICE_ROLE_KEY` ne doit jamais avoir le préfixe `NEXT_PUBLIC_`.

## 3. Paiement mobile money — nyole

Intégration faite d'après la [documentation nyole](https://nyole.com/docs/) : session de paiement, redirection vers la page nyole (MTN MoMo, Orange Money, carte), webhook signé.

1. Récupérer la clé secrète nyole (`af_test_sec_…` pour tester, `af_live_sec_…` en réel) → variable `NYOLE_SECRET_KEY`, et `PAYMENT_PROVIDER=nyole`.
2. Dans le tableau de bord nyole, déclarer l'URL de webhook : `https://VOTRE-SITE/api/payments/webhook`.
3. Tester avec la clé `af_test_…` (paiements simulés depuis la page nyole), puis passer à la clé réelle.

Sécurité : la commande n'est marquée « payée » qu'après confirmation du statut chez nyole (`SUCCESS`, `paid`, montant ≥ total, XAF). Ni la redirection, ni le contenu du webhook ne suffisent. La page de commande resynchronise aussi le statut, même si le webhook tarde.

**Important : nyole indique que, depuis le 17 octobre 2026, les nouveaux comptes encaissent via des outils de son écosystème (LinkAfr, Griotia, Wapilot) et que la documentation API concerne les comptes plus anciens. Si votre compte est récent, confirmez avec nyole que l'API de sessions est activée pour vous.**

`PAYMENT_PROVIDER=mock` : simulation locale, jamais en production.

## Limites connues

- Stock décrémenté au paiement, sans verrou : deux paiements simultanés du dernier article peuvent le survendre (à durcir avec une fonction SQL si fort trafic).
- Le chat client se rafraîchit toutes les 3 s (pas de Realtime) : simple et robuste, mais pas instantané.
- Pas de notification au gérant (email/WhatsApp) à l'arrivée d'une négociation ; il voit les conversations dans `/admin/negociations`.
