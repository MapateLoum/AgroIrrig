# AgroIrrig Sénégal

Prédiction des besoins en irrigation agricole au Sénégal — Machine Learning (XGBoost),
données réelles NASA POWER + SoilGrids, 14 régions du Sénégal.

## Architecture

```
Utilisateur choisit région + remplit 5 champs (culture, stade, surface, paillage, irrig. précédente)
        │
        ▼
Next.js (web/) — TypeScript, App Router
    ├─ NextAuth (inscription/connexion)
    ├─ MongoDB Atlas (Prisma) — utilisateurs + historique des prédictions
    ├─ Appelle NASA POWER en direct (climat)
    ├─ Appelle SoilGrids en direct (sol)
    └─ Appelle le micro-service ML ────────┐
                                            ▼
                              ml-service/ (FastAPI, Python)
                              └─ model.pkl (XGBoost, 85.77% accuracy CV)
```

Deux services à lancer séparément (en local ou en prod) :

| Service | Techno | Rôle |
|---|---|---|
| `web/` | Next.js / TypeScript | Frontend, auth, base de données, orchestration API |
| `ml-service/` | FastAPI / Python | Sert uniquement le modèle XGBoost entraîné |

## Démarrage rapide (local)

**Terminal 1 — micro-service ML :**
```bash
cd ml-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Placer model.pkl, encoders.pkl, le_target.pkl dans ml-service/ml/
uvicorn main:app --reload --port 8000
```

**Terminal 2 — application web :**
```bash
cd web
npm install
cp .env.example .env
# Remplir DATABASE_URL (MongoDB Atlas), NEXTAUTH_SECRET, ML_SERVICE_URL
npx prisma generate
npx prisma db push
npm run dev
```

Ouvrir `http://localhost:3000`.

## Fichiers du modèle ML

Les 3 fichiers `.pkl` (`model.pkl`, `encoders.pkl`, `le_target.pkl`) ne sont **pas inclus**
dans ce zip — à copier depuis ta sortie du notebook `AgroIrrig_dataset_reel_senegal.ipynb`
vers `ml-service/ml/`.

## Documentation détaillée

- [`web/README.md`](web/README.md) — structure du frontend/backend, déploiement Vercel
- [`ml-service/README.md`](ml-service/README.md) — API du micro-service, déploiement Render/Railway
