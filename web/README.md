# AgroIrrig Sénégal — Web (Next.js)

Frontend + backend (API routes) de l'application. Auth (NextAuth), base de données
(MongoDB Atlas via Prisma), et orchestration des appels NASA POWER / SoilGrids / micro-service ML.

## Installation

```bash
cd web
npm install
cp .env.example .env
```

Remplir `.env` :
- `DATABASE_URL` : ta chaîne de connexion MongoDB Atlas (Database → Connect → Drivers)
- `NEXTAUTH_SECRET` : générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- `ML_SERVICE_URL` : URL du micro-service FastAPI (`http://localhost:8000` en local)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` : pour l'envoi des emails (OTP inscription, reset mot de passe) — voir les commentaires dans `.env.example` pour créer un mot de passe d'application Gmail

## Générer le client Prisma + pousser le schéma vers MongoDB Atlas

```bash
npx prisma generate
npx prisma db push
```

`db push` crée les collections dans ta base Atlas à partir de `prisma/schema.prisma`
(pas besoin de migrations classiques avec MongoDB).

## Lancer en développement

```bash
npm run dev
```

App disponible sur `http://localhost:3000`. **Le micro-service ML (`ml-service/`) doit
tourner en parallèle** sur le port configuré dans `ML_SERVICE_URL`, sinon `/api/predict` échouera.

## Créer un compte admin

**Option A — nouveau compte admin directement (email + mot de passe), pratique en prod :**
```bash
node scripts/create-admin.js "Nom Complet" email@exemple.com MotDePasse123
```
Si l'email existe déjà, ça met juste à jour son mot de passe et son rôle.

**Option B — promouvoir un compte déjà créé via `/register` :**
```bash
node scripts/make-admin.js ton-email@exemple.com
```

Dans les deux cas : reconnecte-toi ensuite — le lien "Admin" apparaît dans la navbar.

## Fonctionnalités ajoutées (v2)

- **Vérification email par OTP** : à l'inscription, un code à 6 chiffres est envoyé par email (Gmail SMTP). Le compte ne peut pas se connecter tant qu'il n'est pas vérifié (`/verify-email`).
- **Mot de passe oublié** : `/forgot-password` envoie un code par email, `/reset-password` permet de définir un nouveau mot de passe avec ce code.
- **Notifications toast** : retours visuels (succès/erreur) dans toute l'app, via `src/components/Toast.tsx`.
- **Graphiques admin** : `/admin` utilise recharts pour visualiser la répartition par région/culture/besoin d'irrigation au lieu de simples listes.
- **Export historique** : boutons CSV et PDF sur `/historique`, respectent les filtres région/culture actifs.

Les comptes créés via `scripts/create-admin.js` ou `scripts/make-admin.js` sont automatiquement marqués comme vérifiés (pas besoin du flux OTP pour l'admin).

## Structure

```
src/
├── app/
│   ├── page.tsx              # landing publique
│   ├── login/                # connexion
│   ├── register/             # inscription
│   ├── dashboard/            # formulaire de prédiction (protégé)
│   ├── historique/           # historique des prédictions (protégé)
│   ├── admin/                # stats globales (protégé, rôle ADMIN)
│   └── api/
│       ├── auth/[...nextauth]/  # NextAuth
│       ├── register/            # création de compte
│       ├── predict/             # orchestration NASA POWER + SoilGrids + ML service
│       ├── history/             # historique paginé
│       └── stats/               # stats admin
├── lib/
│   ├── prisma.ts       # client Prisma singleton
│   ├── auth.ts         # config NextAuth
│   ├── regions.ts      # 14 régions du Sénégal (coords, cultures)
│   ├── nasa-power.ts   # client NASA POWER
│   └── soilgrids.ts    # client SoilGrids (avec fallback pixels masqués)
├── components/
│   ├── Navbar.tsx
│   ├── Providers.tsx   # SessionProvider
│   └── PredictionForm.tsx
└── middleware.ts        # protection des routes /dashboard, /historique, /admin
```

## Déploiement (Vercel)

1. Push le repo sur GitHub
2. Importer sur Vercel, sélectionner le dossier `web/` comme racine du projet
3. Ajouter les mêmes variables d'environnement que `.env` dans les Settings Vercel
4. Déployer le `ml-service/` séparément (Render/Railway) et mettre son URL publique dans `ML_SERVICE_URL`
