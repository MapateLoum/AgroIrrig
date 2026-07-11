# AgroIrrig ML Service

Micro-service FastAPI minimaliste : charge le modèle XGBoost entraîné et expose une route `/predict`.
Aucune logique métier ici (auth, DB, appels NASA POWER/SoilGrids) — tout ça est géré par le frontend Next.js.
Ce service ne fait qu'une chose : recevoir 15 features, renvoyer une prédiction.

## Installation

```bash
cd ml-service
python -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

## Fichiers du modèle

Placer ici, dans le dossier `ml/` :
- `model.pkl`
- `encoders.pkl`
- `le_target.pkl`

(générés par le notebook `AgroIrrig_dataset_reel_senegal.ipynb`)

## Lancer le service

```bash
uvicorn main:app --reload --port 8000
```

Le service tourne sur `http://localhost:8000`.

## Routes

- `GET /` — vérifie que le service tourne
- `GET /options` — valeurs valides pour les champs catégoriels (Soil_Type, Crop_Type, etc.)
- `POST /predict` — prend les 15 features en JSON, renvoie `irrigation_need`, `confidence`, `probabilities`

## Déploiement

Render, Railway, ou Fly.io fonctionnent bien pour un service FastAPI gratuit/pas cher.
Une fois déployé, mettre l'URL publique dans `ML_SERVICE_URL` du `.env` du projet Next.js.
