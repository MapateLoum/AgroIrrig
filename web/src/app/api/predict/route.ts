import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchLatestClimate, seasonFromDate } from "@/lib/nasa-power";
//import { fetchSoil } from "@/lib/soilgrids";
import { REGION_SOIL } from "@/lib/regionsSoil";
import { REGIONS, RegionKey } from "@/lib/regions";

export const maxDuration = 60; // secondes — max autorisé sur le plan Hobby Vercel
interface PredictBody {
  region: RegionKey;
  cropType: string;
  cropGrowthStage: string;
  fieldAreaHectare: number;
  mulchingUsed: "Yes" | "No";
  previousIrrigationMm: number;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: PredictBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const { region, cropType, cropGrowthStage, fieldAreaHectare, mulchingUsed, previousIrrigationMm } = body;

  if (!region || !REGIONS[region]) {
    return NextResponse.json({ error: "Région invalide" }, { status: 422 });
  }
  if (!cropType || !cropGrowthStage) {
    return NextResponse.json({ error: "Culture et stade de croissance requis" }, { status: 422 });
  }
  if (typeof fieldAreaHectare !== "number" || fieldAreaHectare <= 0) {
    return NextResponse.json({ error: "Surface du champ invalide" }, { status: 422 });
  }
  if (mulchingUsed !== "Yes" && mulchingUsed !== "No") {
    return NextResponse.json({ error: "mulchingUsed doit être 'Yes' ou 'No'" }, { status: 422 });
  }
  if (typeof previousIrrigationMm !== "number" || previousIrrigationMm < 0) {
    return NextResponse.json({ error: "Irrigation précédente invalide" }, { status: 422 });
  }

  const coords = REGIONS[region];

  // --- 1. Climat en direct (NASA POWER) ---
  let climate;
  try {
    climate = await fetchLatestClimate(coords.lat, coords.lon);
  } catch (err) {
    console.error("Erreur NASA POWER:", err);
    return NextResponse.json(
      { error: "Impossible de récupérer les données climatiques (NASA POWER). Réessaie dans quelques instants." },
      { status: 502 }
    );
  }

  // --- 2. Sol (SoilGrids), mis en cache par région ---
  // let soil;
  // try {
  //   soil = await fetchSoil(coords.lat, coords.lon, region);
  // } catch (err) {
  //   console.error("Erreur SoilGrids:", err);
  //   return NextResponse.json(
  //     { error: "Impossible de récupérer les données de sol (SoilGrids). Réessaie dans quelques instants." },
  //     { status: 502 }
  //   );
  // }

// --- 2. Sol : valeurs figées par région (SoilGrids est en pause côté fournisseur
  // depuis fin 2025/2026, sans date de retour annoncée ; le sol ne change de toute
  // façon pas d'un jour à l'autre, voir src/lib/regionsSoil.ts) ---
  const soil = REGION_SOIL[region];
  if (!soil) {
    return NextResponse.json(
      { error: `Aucune donnée de sol disponible pour la région "${region}"` },
      { status: 500 }
    );
  }
  const season = seasonFromDate(climate.date);

  const mlPayload = {
    Soil_Type: soil.soilType,
    Soil_pH: soil.soilPh,
    Soil_Moisture: climate.soilMoisture,
    Organic_Carbon: soil.organicCarbon,
    Temperature_C: climate.temperatureC,
    Humidity: climate.humidity,
    Rainfall_mm: climate.rainfallMm,
    Sunlight_Hours: climate.sunlightHours,
    Wind_Speed_kmh: climate.windSpeedKmh,
    Season: season,
    Crop_Type: cropType,
    Crop_Growth_Stage: cropGrowthStage,
    Field_Area_hectare: fieldAreaHectare,
    Mulching_Used: mulchingUsed,
    Previous_Irrigation_mm: previousIrrigationMm,
  };

  // --- 3. Appel au micro-service ML (le modèle XGBoost) ---
  const mlServiceUrl = process.env.ML_SERVICE_URL;
  if (!mlServiceUrl) {
    return NextResponse.json(
      { error: "ML_SERVICE_URL n'est pas configurée côté serveur" },
      { status: 500 }
    );
  }

  let mlResult;
  try {
const mlResp = await fetch(`${mlServiceUrl}/predict`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(mlPayload),
  signal: AbortSignal.timeout(55000),
});

    if (!mlResp.ok) {
      const errBody = await mlResp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody.detail || "Le service de prédiction a renvoyé une erreur" },
        { status: 502 }
      );
    }

    mlResult = await mlResp.json();
  } catch (err) {
    console.error("Erreur appel ML service:", err);
    return NextResponse.json(
      { error: "Le service de prédiction est injoignable" },
      { status: 502 }
    );
  }

  // --- 4. Sauvegarde en base (historique) ---
  const prediction = await prisma.prediction.create({
    data: {
      userId: session.user.id,
      region,
      soilType: soil.soilType,
      soilPh: soil.soilPh,
      soilMoisture: climate.soilMoisture,
      organicCarbon: soil.organicCarbon,
      temperatureC: climate.temperatureC,
      humidity: climate.humidity,
      rainfallMm: climate.rainfallMm,
      sunlightHours: climate.sunlightHours,
      windSpeedKmh: climate.windSpeedKmh,
      season,
      cropType,
      cropGrowthStage,
      fieldAreaHectare,
      mulchingUsed,
      previousIrrigationMm,
      irrigationNeed: mlResult.irrigation_need,
      confidence: mlResult.confidence,
    },
  });

  return NextResponse.json({
    prediction: {
      id: prediction.id,
      irrigationNeed: mlResult.irrigation_need,
      confidence: mlResult.confidence,
      probabilities: mlResult.probabilities,
    },
    context: {
      region: coords.label,
      climateDate: climate.date,
      season,
      ...mlPayload,
    },
  });
}
