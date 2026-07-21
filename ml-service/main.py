from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import joblib
import pandas as pd
import os

app = FastAPI(title="AgroIrrig ML Service", version="2.0.0")

# En production, restreindre allow_origins à l'URL exacte du frontend Next.js
# (ex: ["https://agroirrig-senegal.vercel.app"]) plutôt que "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = os.path.join(os.path.dirname(__file__), "ml")
model = joblib.load(os.path.join(BASE, "model.pkl"))
encoders = joblib.load(os.path.join(BASE, "encoders.pkl"))
le_target = joblib.load(os.path.join(BASE, "le_target.pkl"))

# Ordre exact attendu par le modèle (model.feature_names_in_)
FEATURES = [
    "Soil_Type", "Soil_pH", "Soil_Moisture", "Organic_Carbon",
    "Temperature_C", "Humidity", "Rainfall_mm", "Sunlight_Hours", "Wind_Speed_kmh",
    "Crop_Type", "Crop_Growth_Stage", "Season",
    "Field_Area_hectare", "Mulching_Used", "Previous_Irrigation_mm",
]


class PredictionInput(BaseModel):
    # --- Récupérées automatiquement côté Next.js (NASA POWER + SoilGrids) ---
    Soil_Type: str
    Soil_pH: float
    Soil_Moisture: float = Field(ge=0, le=100)
    Organic_Carbon: float
    Temperature_C: float
    Humidity: float = Field(ge=0, le=100)
    Rainfall_mm: float = Field(ge=0)
    Sunlight_Hours: float = Field(ge=0, le=24)
    Wind_Speed_kmh: float = Field(ge=0)
    Season: Literal["Hivernage", "Saison_seche"]

    # --- Saisies manuellement par l'utilisateur dans l'app ---
    Crop_Type: str
    Crop_Growth_Stage: str
    Field_Area_hectare: float = Field(gt=0)
    Mulching_Used: Literal["Yes", "No"]
    Previous_Irrigation_mm: float = Field(ge=0)


@app.get("/")
def root():
    return {"message": "AgroIrrig ML Service opérationnel", "model": "XGBoost", "n_features": len(FEATURES)}

@app.head("/")
def root_head():
    return {}

@app.get("/options")
def options():
    """Valeurs valides pour les champs catégoriels (à utiliser pour les <select> côté front)."""
    return {
        "Soil_Type": encoders["Soil_Type"].classes_.tolist(),
        "Crop_Type": encoders["Crop_Type"].classes_.tolist(),
        "Crop_Growth_Stage": encoders["Crop_Growth_Stage"].classes_.tolist(),
        "Season": encoders["Season"].classes_.tolist(),
        "Mulching_Used": encoders["Mulching_Used"].classes_.tolist(),
    }


@app.post("/predict")
def predict(data: PredictionInput):
    row = data.dict()

    # Valider + encoder chaque colonne catégorielle ; message clair si valeur inconnue
    for col, le in encoders.items():
        if row[col] not in le.classes_:
            raise HTTPException(
                status_code=422,
                detail=f"Valeur invalide pour {col}: '{row[col]}'. Valeurs acceptées: {le.classes_.tolist()}",
            )
        row[col] = le.transform([row[col]])[0]

    df = pd.DataFrame([row])[FEATURES]

    prediction = model.predict(df)
    result = le_target.inverse_transform(prediction)[0]

    proba = model.predict_proba(df)[0]
    confidence = round(float(max(proba)) * 100, 2)

    return {
        "irrigation_need": result,
        "confidence": confidence,
        "classes": le_target.classes_.tolist(),
        "probabilities": {
            cls: round(float(p) * 100, 2) for cls, p in zip(le_target.classes_, proba)
        },
    }
